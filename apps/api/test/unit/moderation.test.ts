import { describe, it, expect, afterEach } from 'vitest';
import mongoose from 'mongoose';

import { containsObjectionableContent, assertCleanContent, OFFENSIVE_CONTENT_MESSAGE } from '../../src/utils/content-filter';
import {
  AUTO_HIDE_THRESHOLD,
  shouldAutoHide,
  planReportResolution,
  excludeIds,
  visibleForumFilter,
  excerpt,
} from '../../src/utils/moderation.utils';
import { getRepos, setRepos, resetRepos } from '../../src/repositories';
import {
  getBlockedIds,
  getBlockerIds,
  getMutuallyHiddenIds,
  isBlockedEitherWay,
  invalidateBlockCache,
  clearBlockCache,
} from '../../src/modules/blocks/blocks.service';
import { createReportSchema } from '../../src/modules/reports/reports.validation';

describe('objectionable-content filter', () => {
  it('matches slurs and severe profanity as whole words, case-insensitively', () => {
    expect(containsObjectionableContent('What the FUCK is this')).toBe(true);
    expect(containsObjectionableContent('you absolute cunt.')).toBe(true);
    expect(containsObjectionableContent('Title is fine', 'but the body says Motherfucker!')).toBe(true);
  });

  it('does not flag innocent words that contain a blocked word (Scunthorpe problem)', () => {
    for (const text of [
      'Scunthorpe United won', 'Our class of 1995', 'Annual assessment results', 'Passing the bass',
      'A cocktail evening', 'Shitake mushrooms', 'Classic cassette tapes', 'Hancock Street', 'A chink in the armour',
      'Spick and span', 'Penistone reunion',
    ]) {
      expect(containsObjectionableContent(text), text).toBe(false);
    }
  });

  it('ignores empty input and throws the contract 422 on a match', () => {
    expect(containsObjectionableContent(undefined, null, '')).toBe(false);
    expect(() => assertCleanContent('hello', 'all good')).not.toThrow();
    expect(() => assertCleanContent('fucking spam')).toThrow(OFFENSIVE_CONTENT_MESSAGE);
    try {
      assertCleanContent('fucking spam');
    } catch (err) {
      expect((err as { statusCode?: number }).statusCode).toBe(422);
      expect(OFFENSIVE_CONTENT_MESSAGE).toBe('Please remove offensive language before posting.');
    }
  });
});

describe('auto-hide threshold', () => {
  it('hides forum posts/comments at 3 distinct open reporters', () => {
    expect(AUTO_HIDE_THRESHOLD).toBe(3);
    expect(shouldAutoHide('FORUM_POST', 2)).toBe(false);
    expect(shouldAutoHide('FORUM_POST', 3)).toBe(true);
    expect(shouldAutoHide('FORUM_COMMENT', 4)).toBe(true);
  });

  it('never auto-hides jobs or members (moderator decision only)', () => {
    expect(shouldAutoHide('JOB', 10)).toBe(false);
    expect(shouldAutoHide('MEMBER', 10)).toBe(false);
  });
});

describe('report resolution action mapping', () => {
  it('HIDE_CONTENT hides posts/comments and unapproves jobs', () => {
    expect(planReportResolution('FORUM_POST', 'ACTIONED', 'HIDE_CONTENT')).toMatchObject({ hide: true, unapproveJob: false });
    expect(planReportResolution('FORUM_COMMENT', 'ACTIONED', 'HIDE_CONTENT')).toMatchObject({ hide: true });
    expect(planReportResolution('JOB', 'ACTIONED', 'HIDE_CONTENT')).toMatchObject({ hide: false, unapproveJob: true });
  });

  it('DELETE_CONTENT deletes; SUSPEND_AUTHOR suspends and additionally needs members:edit', () => {
    expect(planReportResolution('JOB', 'ACTIONED', 'DELETE_CONTENT')).toMatchObject({ deleteContent: true, extraPermission: null });
    expect(planReportResolution('FORUM_POST', 'ACTIONED', 'SUSPEND_AUTHOR')).toMatchObject({ suspendAuthor: true, extraPermission: 'members:edit' });
    expect(planReportResolution('MEMBER', 'ACTIONED', 'SUSPEND_AUTHOR')).toMatchObject({ suspendAuthor: true, extraPermission: 'members:edit' });
  });

  it('DISMISSED takes no action and un-hides auto-hidden forum content', () => {
    expect(planReportResolution('FORUM_POST', 'DISMISSED')).toMatchObject({ action: 'NONE', unhideIfAutoHidden: true, hide: false });
    expect(planReportResolution('JOB', 'DISMISSED')).toMatchObject({ unhideIfAutoHidden: false });
    expect(() => planReportResolution('FORUM_POST', 'DISMISSED', 'DELETE_CONTENT')).toThrow(/dismissed/i);
  });

  it('rejects actions that make no sense for a member report', () => {
    expect(() => planReportResolution('MEMBER', 'ACTIONED', 'HIDE_CONTENT')).toThrow(/SUSPEND_AUTHOR/);
    expect(() => planReportResolution('MEMBER', 'ACTIONED', 'DELETE_CONTENT')).toThrow(/SUSPEND_AUTHOR/);
    expect(planReportResolution('MEMBER', 'ACTIONED')).toMatchObject({ action: 'NONE', suspendAuthor: false });
  });
});

describe('visibility / block filter helpers', () => {
  const blocked = ['507f1f77bcf86cd799439011'];

  it('builds $nin exclusions only when there is something to exclude', () => {
    expect(excludeIds('_id', [])).toEqual({});
    expect(excludeIds('postedById', blocked)).toEqual({ postedById: { $nin: blocked } });
  });

  it('member-facing forum filter hides moderated content and blocked authors', () => {
    expect(visibleForumFilter([])).toEqual({ isHidden: { $ne: true } });
    expect(visibleForumFilter(blocked)).toEqual({ isHidden: { $ne: true }, authorId: { $nin: blocked } });
    const forAggregation = visibleForumFilter(blocked, true) as { authorId: { $nin: unknown[] } };
    expect(forAggregation.authorId.$nin[0]).toBeInstanceOf(mongoose.Types.ObjectId);
  });

  it('cuts target excerpts to 280 characters', () => {
    const long = 'word '.repeat(200);
    expect(excerpt(long).length).toBeLessThanOrEqual(280);
    expect(excerpt(long).endsWith('…')).toBe(true);
    expect(excerpt('  short\n text ')).toBe('short text');
  });

  it('validates report payloads (enums, id format, details length)', () => {
    const ok = createReportSchema.safeParse({ body: { targetType: 'FORUM_POST', targetId: blocked[0], reason: 'SPAM' } });
    expect(ok.success).toBe(true);
    expect(createReportSchema.safeParse({ body: { targetType: 'POLL', targetId: blocked[0], reason: 'SPAM' } }).success).toBe(false);
    expect(createReportSchema.safeParse({ body: { targetType: 'JOB', targetId: 'nope', reason: 'SPAM' } }).success).toBe(false);
    expect(createReportSchema.safeParse({ body: { targetType: 'JOB', targetId: blocked[0], reason: 'OTHER', details: 'x'.repeat(1001) } }).success).toBe(false);
  });
});

describe('block cache', () => {
  const A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  const B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
  const C = 'cccccccccccccccccccccccc';
  let calls = 0;
  const rows: Array<{ blockerId: string; blockedId: string }> = [];

  function install() {
    calls = 0;
    rows.length = 0;
    const memberBlocks = {
      async findMany(filter: { blockerId?: string; blockedId?: string }) {
        calls++;
        return rows.filter((r) => (filter.blockerId ? r.blockerId === filter.blockerId : r.blockedId === filter.blockedId));
      },
    };
    setRepos({ ...getRepos(), memberBlocks } as never);
    clearBlockCache();
  }
  afterEach(() => {
    resetRepos();
    clearBlockCache();
  });

  it('resolves both directions and mutual hiding', async () => {
    install();
    rows.push({ blockerId: A, blockedId: B }, { blockerId: C, blockedId: A });
    expect(await getBlockedIds(A)).toEqual([B]);
    expect(await getBlockerIds(A)).toEqual([C]);
    expect((await getMutuallyHiddenIds(A)).sort()).toEqual([B, C]);
    expect(await isBlockedEitherWay(B, A)).toBe(true); // A blocked B → refused both ways
    expect(await isBlockedEitherWay(B, C)).toBe(false);
    expect(await getBlockedIds(undefined)).toEqual([]);
  });

  it('caches per member and is invalidated on block/unblock', async () => {
    install();
    await getBlockedIds(A);
    await getBlockedIds(A);
    expect(calls).toBe(1);

    rows.push({ blockerId: A, blockedId: B });
    expect(await getBlockedIds(A)).toEqual([]); // stale until invalidated…
    invalidateBlockCache(A, B);
    expect(await getBlockedIds(A)).toEqual([B]); // …blockMember()/unblockMember() invalidate immediately
  });
});
