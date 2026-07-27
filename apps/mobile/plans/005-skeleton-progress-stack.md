# 005 — Skeleton pulse, animated progress values, stack transitions

- **Status**: DONE
- **Commit**: 130c9a3
- **Severity**: MEDIUM
- **Category**: Purpose & frequency / interruptibility / cohesion
- **Estimated scope**: 2 files, small (`apps/mobile/components/mobile-ui.tsx`, `apps/mobile/app/_layout.tsx`)
- **Depends on**: 002-motion-toolkit (provides `Motion`, `useReducedMotion`)

## Problem

Three related flat spots:
1. `SkeletonBar` (`apps/mobile/components/mobile-ui.tsx:448-475`) is a static rectangle — loading states look frozen.
2. `ProgressBar` (same file) snaps its width instantly on every value change (dues ring, funding bars).
3. Stack screens in `apps/mobile/app/_layout.tsx` use default transitions; pushed screens and modal-ish flows share the same motion personality.

## Target

1. **SkeletonBar**: add a subtle opacity pulse — loop `Animated.sequence([to 0.45 over 900ms, to 1 over 900ms])` with `Motion.easeInOut`, `useNativeDriver: false`. Skip the pulse when `useReducedMotion()` is true (static bar, still visible).
2. **ProgressBar**: animate the fill width on change — drive an `Animated.Value` (0–1) toward `progress` over 260ms `Motion.easeOut` (`useNativeDriver: false`), mapping to width % via `interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })`.
3. **Stack transitions** in `apps/mobile/app/_layout.tsx`: set `screenOptions={{ headerShown: false, animation: 'slide_from_right' }}` on the Stack, and `animation: 'slide_from_bottom'` for the clearly modal flows: `profile/edit`, `gallery/index`, `requests/index`, `help/index`, `settings/index`, `dues/index`, `donations/index`, `contact/index`. Keep headers as configured.

## Repo conventions to follow

- `Motion`/`useReducedMotion` from `apps/mobile/components/motion.tsx` (plan 002).
- Animated.Value via `useState(() => new Animated.Value(x))`.
- Do not alter skeleton/progress colors or dimensions — motion only.

## Steps

1. `mobile-ui.tsx` SkeletonBar → pulse loop as specified (start in `useEffect`, stop on unmount with `.stop()`).
2. `mobile-ui.tsx` ProgressBar → animated width as specified; animate whenever the `progress` prop changes (`useEffect` on prop).
3. `app/_layout.tsx` Stack → animation options as specified.

## Boundaries

- Only the two files listed.
- No dependencies.
- Do not change what the skeletons/progress bars render, only how they move.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npm run lint` in `apps/mobile` → clean.
- **Feel check**: any loading screen: skeletons breathe gently (not blink); dues/donations pages: funding bars glide to their values on load; pushing a screen slides from the right, opening Settings/Dues slides from the bottom; reduced-motion → no pulse, bars set instantly.
- **Done when**: all three behaviors are live on web and native.
