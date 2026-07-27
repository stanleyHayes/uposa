# 001 — Circular reveal for the theme toggle

- **Status**: DONE
- **Commit**: 130c9a3
- **Severity**: HIGH
- **Category**: Missed opportunity / physicality
- **Estimated scope**: 2 files, medium

## Problem

The theme toggle in `apps/mobile/components/app-toolbar.tsx` calls `setPreference` in `apps/mobile/lib/theme-context.tsx:56-66`, which animates a flat full-screen opacity crossfade (overlay covers the screen, fades out). It reads as a static color swap with a blur — no spatial origin, no delight. The user explicitly asked for a **circular reveal** (like the alumni web app's View-Transitions circular reveal in `apps/alumni/src/hooks/useTheme.ts`).

## Target

Tapping the theme icon in the toolbar starts a circle at the tap coordinates; the circle carries the **new** theme's background color and expands from `scale(0)`—no: from a small circle (`scale` 0 → cover radius) with strong ease-out until it covers the screen; mid-way (when the circle covers ~100%), the actual scheme flips underneath; the circle then fades out within 200ms. Total ~600ms. The underlying UI never double-exposes.

Exact values (RN Animated, JS driver — this runs on web and native):
- Ease-out curve: `Easing.bezier(0.23, 1, 0.32, 1)` (strong ease-out).
- Expand: 500ms, `useNativeDriver: false` (web).
- Fade-out after flip: 160ms, `useNativeDriver: false`.
- Circle implementation: absolutely positioned `Animated.View`, `width/height` = `2 * coverRadius`, `borderRadius` = coverRadius, centered on the tap point via `top/left` offsets, `transform: [{ scale }]`. `coverRadius = Math.hypot(max(x, screenW - x), max(y, screenH - y))`.
- Reduced motion: if `AccessibilityInfo.isReduceMotionEnabled()` is true, skip the circle and flip instantly.

## Repo conventions to follow

- Palette/brand: `apps/mobile/constants/theme.ts` (`Brand.cream` light bg, `Brand.darkBg` dark bg — `backgroundFor` already exists in theme-context).
- Animated values follow the `useState(() => new Animated.Value(0))` pattern (see `apps/mobile/lib/theme-context.tsx` and `apps/mobile/components/splash-screen.tsx`) — NOT `useRef(...).current` (fails react-hooks lint).
- All colors from `Colors[scheme]`/`Brand` — no hardcoded hex outside Brand.

## Steps

1. In `apps/mobile/lib/theme-context.tsx`:
   - Keep `setPreference` signature; add `setPreferenceAt(origin: { x: number; y: number } | null, next: ThemePreference)` that performs the circular reveal then calls the existing logic. `setPreference(next)` becomes `setPreferenceAt(null, next)` with the plain instant flip (keep the existing 420ms overlay fade as the `origin === null` path — settings page tiles use that).
   - Circular reveal path: compute coverRadius from `Dimensions.get('window')`, set overlay circle color to `backgroundFor(nextScheme)` (the NEW scheme), position at origin, `scale` 0→1 over 500ms `Easing.bezier(0.23, 1, 0.32, 1)`, then `setPreferenceState(next)`, then fade overlay 1→0 over 160ms.
   - Reduced motion check once via `AccessibilityInfo.isReduceMotionEnabled()`; when true, skip all animation.
2. In `apps/mobile/components/app-toolbar.tsx`: change the theme `Pressable`'s `onPress` to use the event: `onPress={(e) => { setPreferenceAt({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }, isDark ? 'light' : 'dark'); }}`. Import `setPreferenceAt` accordingly (extend `useThemePreference`'s context value type with `setPreferenceAt`).

## Boundaries

- Do NOT touch any screen files — only the two files listed.
- Do NOT add dependencies (no react-native-view-shot, no new libs).
- Do NOT change the settings-page theme tiles' behavior (they keep the plain path).
- If the code has drifted from what's described above, STOP and report.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npm run lint` in `apps/mobile` → clean.
- **Feel check**: run the app, tap the theme icon in the toolbar:
  - The new theme's color grows as a circle FROM THE ICON, not from screen center and not as a flat fade.
  - The flip underneath happens exactly when the circle fully covers the screen (no double-exposure, no flash of the old theme).
  - Toggling back reveals from the same point in the opposite color.
  - With reduced motion enabled (Accessibility settings), the flip is instant.
- **Done when**: theme changes originate as a circular reveal from the tap point on web and native.
