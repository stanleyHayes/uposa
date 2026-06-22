import { flushSync } from 'react-dom'

/**
 * Run a theme toggle as a circular reveal expanding from the click point using
 * the View Transitions API. `toggle` must apply the theme change synchronously
 * (the admin store's toggleDarkMode flips the `dark` class inline, so it does).
 * Falls back to an instant toggle when the API is unavailable or the user
 * prefers reduced motion.
 */
export function animateThemeToggle(toggle: () => void, event?: { clientX: number; clientY: number }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const canAnimate = typeof document !== 'undefined' && 'startViewTransition' in document

  if (!canAnimate || reduce) {
    toggle()
    return
  }

  const x = event?.clientX ?? window.innerWidth - 48
  const y = event?.clientY ?? 48
  const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

  const transition = (document as Document & {
    startViewTransition: (cb: () => void) => { ready: Promise<void> }
  }).startViewTransition(() => {
    flushSync(toggle)
  })

  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
      { duration: 480, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
    )
  })
}
