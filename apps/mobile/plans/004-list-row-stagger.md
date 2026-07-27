# 004 — Staggered list-row entrances on list screens

- **Status**: DONE
- **Commit**: 130c9a3
- **Severity**: MEDIUM
- **Category**: Missed opportunity / cohesion
- **Estimated scope**: ~10 screen files, small edits each
- **Depends on**: 002-motion-toolkit (provides `FadeInUp`, `Motion`)

## Problem

Every FlatList in the app (events, news, members, forum, polls, elections, jobs, projects, dues, donations, mentorship, gallery) renders all rows instantly — content teleports in after loading. Rows should cascade once on first render.

## Target

Wrap each list's `renderItem` output in `FadeInUp` with an index-based delay:

- delay = `Math.min(index, 7) * 40` ms (cap at 7 — long lists must not keep delaying)
- distance 10, entrance 260ms, ease `Motion.easeOut`
- Only animate the initial mount: `FadeInUp` already animates on mount only; do NOT re-animate on refresh/scroll recycling — gate with a `hasMounted` ref per screen OR rely on the fact that FlatList recycles: wrap so animation only applies when `index < 8` (rows beyond 8 render plain).

Screens to update (renderItem wrappers only, no other changes):
- `apps/mobile/app/(tabs)/events.tsx`
- `apps/mobile/app/(tabs)/news.tsx`
- `apps/mobile/app/(tabs)/members.tsx`
- `apps/mobile/app/forum/index.tsx`
- `apps/mobile/app/polls/index.tsx`
- `apps/mobile/app/elections/index.tsx`
- `apps/mobile/app/jobs/index.tsx`
- `apps/mobile/app/projects/index.tsx`
- `apps/mobile/app/donations/index.tsx` (history rows)
- `apps/mobile/app/dues/index.tsx` (due rows)

## Repo conventions to follow

- `FadeInUp` from `apps/mobile/components/motion.tsx` (plan 002).
- Match each screen's existing renderItem structure — wrap, don't restructure.

## Steps

1. In each listed screen: import `FadeInUp` from `@/components/motion`.
2. Wrap the row component in `renderItem` with `<FadeInUp delay={Math.min(index, 7) * 40} distance={10}>` when `index < 8`, otherwise render the row directly.
3. Do not touch data loading, pull-to-refresh, or pagination logic.

## Boundaries

- Only the listed screens' renderItem paths.
- No changes to mobile-ui.tsx, API calls, or list content/layout.
- No dependencies.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npm run lint` in `apps/mobile` → clean.
- **Feel check**: open Events and Members: rows cascade in top-to-bottom on first load (not on pull-to-refresh re-render of already-visible rows, not on scroll to row 20); cascade never blocks tapping; reduced-motion → rows appear instantly.
- **Done when**: all listed screens stagger their first ~8 rows and nothing else changes.
