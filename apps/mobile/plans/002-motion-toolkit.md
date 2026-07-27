# 002 — Motion toolkit: easing tokens, FadeInUp, PressableScale, reduced-motion

- **Status**: DONE
- **Commit**: 130c9a3
- **Severity**: HIGH
- **Category**: Cohesion & tokens / physicality / accessibility
- **Estimated scope**: 2 files (1 new, 1 edit), small

## Problem

The app has no shared motion primitives. Every future animation would hand-type easings and re-implement entrance/press logic. Create ONE toolkit everything else uses. Concretely missing: easing/duration tokens, a fade+rise entrance wrapper, a press-scale wrapper, and a reduced-motion helper.

## Target

New file `apps/mobile/components/motion.tsx` exporting:

1. **Tokens** (exported constants, the single source of truth):
   - `Motion.easeOut = Easing.bezier(0.23, 1, 0.32, 1)` (strong ease-out, entrances/exits)
   - `Motion.easeInOut = Easing.bezier(0.77, 0, 0.175, 1)` (on-screen movement)
   - `Motion.duration = { press: 120, entrance: 260, exit: 180, stagger: 40 }` (ms)
2. **`useReducedMotion(): boolean`** — reads `AccessibilityInfo.isReduceMotionEnabled()` once on mount (async, default false).
3. **`FadeInUp`** — wrapper component: `{ children, delay?: number, distance?: number, style? }`. Renders `Animated.View` that on mount animates `opacity` 0→1 and `translateY` `distance ?? 12`→0 over 260ms with `Motion.easeOut` and the given `delay` (default 0), `useNativeDriver: false`. If `useReducedMotion()` is true, renders children with no transform and full opacity immediately.
4. **`PressableScale`** — wrapper: `{ children, onPress?, style?, disabled?, scale?: number, hitSlop? }`. Pressable that animates `scale` to `scale ?? 0.97` on press-in over 120ms `Motion.easeOut`, back to 1 on press-out over 120ms, plus existing opacity feel (0.82 pressed opacity is the app idiom — keep opacity behavior optional via prop `fade?: boolean`, default true). If reduced motion, no scale (plain press opacity).

Also add `Animated` import hygiene: plain `Animated` from `react-native` (works on web and native), values via `useState(() => new Animated.Value(0))` — never `useRef(...).current`.

## Repo conventions to follow

- Colors/fonts untouched — this file is motion-only; it imports nothing from theme except types if needed.
- Existing exemplar of the Animated.Value pattern: `apps/mobile/components/splash-screen.tsx`.
- Existing exemplar of press-opacity idiom: `apps/mobile/components/mobile-ui.tsx` (`opacity: pressed ? 0.78 : 1`).

## Steps

1. Create `apps/mobile/components/motion.tsx` exactly as specified above (full implementation, TypeScript strict-clean).
2. Re-export nothing yet — plans 003/004 wire it in.

## Boundaries

- Do NOT modify any screen or mobile-ui.tsx in this plan.
- Do NOT add dependencies.
- Do NOT use react-native-reanimated (plain RN Animated only — reanimated shared values broke on web earlier).
- If react-native's `Easing.bezier` is unavailable (it is available in RN 0.86), STOP and report.

## Verification

- **Mechanical**: `npx tsc --noEmit` in `apps/mobile` → clean.
- **Feel check**: temporary usage in one screen (or plan 003): children fade+rise in, press scales subtly; with reduced motion on, no movement.
- **Done when**: `components/motion.tsx` exports `Motion`, `useReducedMotion`, `FadeInUp`, `PressableScale` and typechecks.
