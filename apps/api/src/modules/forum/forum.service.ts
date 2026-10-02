import { escapeRegex } from '../../utils/search.utils';
import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { generateUniqueSlug } from '../../utils/response.utils';
import { CreatePostInput, UpdatePostInput, CreateCommentInput } from './forum.validation';
import { emitForumNewPost, emitForumNewComment } from '../../config/socket';
import { assertCleanContent } from '../../utils/content-filter';
import { visibleForumFilter } from '../../utils/moderation.utils';
import { getBlockedIds, getBlockerIds } from '../blocks/blocks.service';

async function attachAuthor(doc: Record<string, any>): Promise<Record<string, any>> {
  if (!doc.authorId) return { ...doc, author: null };
  const { members: memberRepo } = getRepos();
  const a = await memberRepo.findById(String(doc.authorId), { projection: 'fullName photoUrl' });
  return { ...doc, author: a ? { id: a.id, fullName: (a as any).fullName, photoUrl: (a as any).photoUrl } : null };
}

// Author emails are admin-only: members see name + photo, matching the member
// directory's privacy rules (no harvesting other members' addresses via the forum).
async function attachAuthorMany(docs: Record<string, any>[], includeEmail = false): Promise<Record<string, any>[]> {
  const ids = [...new Set(docs.map(d => d.authorId).filter(Boolean))];
  if (ids.length === 0) return docs.map(d => ({ ...d, author: null }));
  const { members: memberRepo } = getRepos();
  const aDocs = await memberRepo.findMany({ _id: { $in: ids } }, { projection: 'fullName photoUrl email' });
  const aMap = new Map(aDocs.map((a: any) => [String(a.id), { id: a.id, fullName: a.fullName, photoUrl: a.photoUrl, ...(includeEmail ? { email: a.email } : {}) }]));
  return docs.map(d => ({ ...d, author: d.authorId ? aMap.get(String(d.authorId)) || null : null }));
}

export async function listPosts(query: Record<string, string | undefined>, viewerId?: string) {
  const { page, limit, skip } = getPaginationParams(query);
  const { category, search } = query;
  const { forumPosts, forumComments } = getRepos();

  // Members never see moderated (hidden) content or posts by people they blocked.
  const blockedIds = await getBlockedIds(viewerId);
  const where: Record<string, unknown> = { ...visibleForumFilter(blockedIds) };
  if (category) where.category = category.toUpperCase();
  if (search) {
    where.$or = [
      { title: { $regex: escapeRegex(search), $options: 'i' } },
      { content: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    forumPosts.findMany(where, { sort: { isPinned: -1, createdAt: -1 }, skip, limit }),
    forumPosts.count(where),
  ]);

  const withAuthors = await attachAuthorMany(data);

  // Attach comment counts (only comments this viewer can see)
  const postIds = data.map((p: any) => p.id);
  const commentCounts = await forumComments.aggregate<{ _id: string; count: number }>([
    { $match: { postId: { $in: postIds }, ...visibleForumFilter(blockedIds, true) } },
    { $group: { _id: '$postId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(commentCounts.map(c => [String(c._id), c.count]));

  const result = withAuthors.map(d => ({
    ...d,
    _count: { comments: countMap.get(String(d.id)) || 0 },
  }));

  return { data: result, meta: buildPaginationMeta(page, limit, total) };
}

export async function getPostBySlug(slug: string, viewerId?: string) {
  const { forumPosts, forumComments } = getRepos();

  const blockedIds = await getBlockedIds(viewerId);
  const post = await forumPosts.findOne({ slug, ...visibleForumFilter(blockedIds) });
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });

  // Get top-level comments with author info (hidden / blocked authors excluded)
  const comments = await forumComments.findMany(
    { postId: post.id, parentId: null, ...visibleForumFilter(blockedIds) },
    { sort: { createdAt: 1 } },
  );
  const commentsWithAuthors = await attachAuthorMany(comments);

  const withAuthor = await attachAuthor(post);

  // Increment view count
  await forumPosts.updateById(post.id, { $inc: { viewCount: 1 } });

  return {
    ...withAuthor,
    comments: commentsWithAuthors,
  };
}

export async function createPost(authorId: string, data: CreatePostInput) {
  assertCleanContent(data.title, data.content);
  const { forumPosts } = getRepos();
  const slug = generateUniqueSlug(data.title);
  const post = await forumPosts.create({
    title: data.title,
    slug,
    content: data.content,
    category: data.category || 'GENERAL',
    authorId,
    viewCount: 0,
    isPinned: false,
    isLocked: false,
  });

  const withAuthor = await attachAuthor(post);
  emitForumNewPost(withAuthor, await getBlockerIds(authorId));
  return withAuthor;
}

export async function updatePost(postId: string, authorId: string, data: UpdatePostInput, isAdmin: boolean) {
  assertCleanContent(data.title, data.content);
  const { forumPosts } = getRepos();

  const post = await forumPosts.findById(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  if (!isAdmin && String((post as any).authorId) !== authorId) {
    throw Object.assign(new Error('Not authorized to edit this post'), { statusCode: 403 });
  }
  if ((post as any).isLocked && !isAdmin) {
    throw Object.assign(new Error('This post is locked'), { statusCode: 403 });
  }

  const result = await forumPosts.updateById(postId, { ...data });
  if (!result) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  const withAuthor = await attachAuthor(result);
  return withAuthor;
}

export async function deletePost(postId: string, authorId: string, isAdmin: boolean) {
  const { forumPosts } = getRepos();

  const post = await forumPosts.findById(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  if (!isAdmin && String((post as any).authorId) !== authorId) {
    throw Object.assign(new Error('Not authorized to delete this post'), { statusCode: 403 });
  }

  await forumPosts.deleteById(postId);
  return { message: 'Post deleted successfully' };
}

export async function addComment(postId: string, authorId: string, data: CreateCommentInput) {
  assertCleanContent(data.content);
  const { forumPosts, forumComments } = getRepos();

  const post = await forumPosts.findById(postId);
  // A hidden post can't be commented on (it isn't visible to members).
  if (!post || post.isHidden) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  if ((post as any).isLocked) {
    throw Object.assign(new Error('This post is locked for comments'), { statusCode: 403 });
  }

  const comment = await forumComments.create({
    postId: postId,
    authorId,
    content: data.content,
    parentId: data.parentId || null,
  });

  const withAuthor = await attachAuthor(comment);
  emitForumNewComment(postId, withAuthor, await getBlockerIds(authorId));
  return withAuthor;
}

export async function deleteComment(commentId: string, authorId: string, isAdmin: boolean) {
  const { forumComments } = getRepos();

  const comment = await forumComments.findById(commentId);
  if (!comment) throw Object.assign(new Error('Comment not found'), { statusCode: 404 });
  if (!isAdmin && String((comment as any).authorId) !== authorId) {
    throw Object.assign(new Error('Not authorized to delete this comment'), { statusCode: 403 });
  }

  await forumComments.deleteById(commentId);
  return { message: 'Comment deleted successfully' };
}

// Admin services
export async function adminListPosts(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { category, search, isPinned, isLocked } = query;
  const { forumPosts, forumComments } = getRepos();

  const where: Record<string, unknown> = {};
  if (category) where.category = category.toUpperCase();
  if (isPinned !== undefined) where.isPinned = isPinned === 'true';
  if (isLocked !== undefined) where.isLocked = isLocked === 'true';
  if (search) {
    where.$or = [
      { title: { $regex: escapeRegex(search), $options: 'i' } },
      { content: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    forumPosts.findMany(where, { sort: { isPinned: -1, createdAt: -1 }, skip, limit }),
    forumPosts.count(where),
  ]);

  const withAuthors = await attachAuthorMany(data, true);

  const postIds = data.map((p: any) => p.id);
  const commentCounts = await forumComments.aggregate<{ _id: string; count: number }>([
    { $match: { postId: { $in: postIds } } },
    { $group: { _id: '$postId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(commentCounts.map(c => [String(c._id), c.count]));

  const result = withAuthors.map(d => ({
    ...d,
    _count: { comments: countMap.get(String(d.id)) || 0 },
  }));

  return { data: result, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminTogglePinPost(postId: string) {
  const { forumPosts } = getRepos();

  const post = await forumPosts.findById(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });

  const result = await forumPosts.updateById(postId, { isPinned: !(post as any).isPinned });
  if (!result) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  const withAuthor = await attachAuthor(result);
  return withAuthor;
}

export async function adminToggleLockPost(postId: string) {
  const { forumPosts } = getRepos();

  const post = await forumPosts.findById(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });

  const result = await forumPosts.updateById(postId, { isLocked: !(post as any).isLocked });
  if (!result) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  const withAuthor = await attachAuthor(result);
  return withAuthor;
}

export async function adminDeletePost(postId: string) {
  const { forumPosts } = getRepos();

  const post = await forumPosts.findById(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  await forumPosts.deleteById(postId);
  return { message: 'Post deleted by admin' };
}

export async function adminDeleteComment(commentId: string) {
  const { forumComments } = getRepos();

  const comment = await forumComments.findById(commentId);
  if (!comment) throw Object.assign(new Error('Comment not found'), { statusCode: 404 });
  await forumComments.deleteById(commentId);
  return { message: 'Comment deleted by admin' };
}

export async function adminUpdatePost(postId: string, data: UpdatePostInput) {
  assertCleanContent(data.title, data.content);
  const { forumPosts } = getRepos();

  const post = await forumPosts.findById(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });

  const result = await forumPosts.updateById(postId, { ...data });
  if (!result) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  const withAuthor = await attachAuthor(result);
  return withAuthor;
}
