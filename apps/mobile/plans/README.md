# Animation plans — UPOSA Alumni mobile

Audit date: 2026-07-27 · Commit: 130c9a3 · Scope: `apps/mobile`

| # | Title | Severity | Status | Depends on |
| --- | --- | --- | --- | --- |
| 001 | Circular reveal for the theme toggle | HIGH | DONE | — |
| 002 | Motion toolkit (tokens, FadeInUp, PressableScale, reduced-motion) | HIGH | DONE | — |
| 003 | Entrances and press-scale in the shared UI kit | HIGH | DONE | 002 |
| 004 | Staggered list-row entrances on list screens | MEDIUM | DONE | 002 |
| 005 | Skeleton pulse, animated progress values, stack transitions | MEDIUM | DONE | 002 |

## Recommended execution order

1. **002** — everything depends on the toolkit.
2. **001** — independent of 002; can run in parallel with it.
3. **003** — highest user-visible leverage after the toolkit.
4. **004** and **005** — independent of each other; run in parallel after 003.

## Notes

- All values come from the audit playbook: entrances 260ms `Easing.bezier(0.23, 1, 0.32, 1)`, press scale 0.97–0.98 in 120ms, stagger 40ms, UI animations under 300ms.
- Plain RN `Animated` everywhere (reanimated shared values broke on web earlier in this codebase).
- Every plan includes a reduced-motion path via `AccessibilityInfo`.
