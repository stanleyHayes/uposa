# 003 — Entrances and press-scale in the shared UI kit

- **Status**: DONE
- **Commit**: 130c9a3
- **Severity**: HIGH
- **Category**: Missed opportunity / physicality
- **Estimated scope**: 1 file, medium (`apps/mobile/components/mobile-ui.tsx`)
- **Depends on**: 002-motion-toolkit (provides `FadeInUp`, `PressableScale`, `Motion`)

## Problem

Every screen renders statically: `ScreenHeader`, `HeroPanel`, `Surface` cards, `StatTile`s, `ActionRow`s all pop into existence at once, and every pressable in the kit gives opacity-only feedback. Because all ~30 screens are built from this one kit, animating the kit animates the whole app — highest leverage change available.

## Target

In `apps/mobile/components/mobile-ui.tsx` (using `FadeInUp`, `PressableScale`, `Motion` from `./motion`):

1. **ScreenHeader** — wrap in `FadeInUp` (delay 0, distance 12).
2. **HeroPanel** — wrap in `FadeInUp` (delay 60, distance 14).
3. **Surface** — add optional `enterDelay?: number` prop; when provided, wrap in `FadeInUp` with that delay. Do NOT animate all Surfaces unconditionally (modals/sheets use Surface too — only opt-in via prop).
4. **StatTile** — wrap in `FadeInUp` with stagger: delay = `120 + index * 40` (add optional `index?: number` prop, default 0), distance 10.
5. **PrimaryButton** — replace its inner `Pressable` with `PressableScale` (scale 0.97, 120ms ease-out, keep existing disabled/loading opacity logic). Press feedback becomes scale+opacity instead of opacity-only.
6. **ActionRow** — same PressableScale treatment (scale 0.98, keep `activeOpacity` feel via the fade prop).
7. **Pill** (when rendered as a Pressable by callers, no change here) — no change in this plan.

Exact values: entrance 260ms `Easing.bezier(0.23, 1, 0.32, 1)`, translateY 10–14px, stagger 40ms; press scale 0.97–0.98 in 120ms.

## Repo conventions to follow

- The kit's existing style: props objects, `palette` prop everywhere, StyleSheet at bottom.
- Do not change any component's visual output when at rest — motion only.
- `PressableScale`/`FadeInUp` come from `apps/mobile/components/motion.tsx` (plan 002).

## Steps

1. Import `{ FadeInUp, PressableScale, Motion }` from `./motion` in `apps/mobile/components/mobile-ui.tsx`.
2. Apply items 1–6 above, keeping every existing prop/behavior intact.
3. Sweep the kit for leftover `opacity: pressed ? 0.78 : 1`-only pressables and route them through PressableScale where they are buttons (not text links).

## Boundaries

- Only `apps/mobile/components/mobile-ui.tsx` (+ the dependency from plan 002).
- Do NOT change colors, fonts, spacing, or component prop signatures beyond the two optional props (`enterDelay`, `index`).
- Do NOT animate `SkeletonBar` here — that is plan 005.
- Do NOT add dependencies.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npm run lint` in `apps/mobile` → clean.
- **Feel check**: open the Home dashboard: header fades/rises first, hero follows ~60ms later, stat tiles cascade; pressing Sign in / any ActionRow shows a subtle 0.97 scale squeeze; nothing blocks taps during the stagger; reduced-motion → everything static but visible.
- **Done when**: every screen built on the kit has staggered entrances and scale press feedback with no visual change at rest.
