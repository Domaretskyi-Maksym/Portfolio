import gsap from 'gsap'

const FLIP_SECONDS = 0.95

/**
 * FLIP: renders `el` as if it still occupied `from`, then animates it into its real layout.
 * Product views read their element's rect every frame, so the 3D model follows the motion.
 */
export function flipFrom(el: HTMLElement, from: DOMRect, duration = FLIP_SECONDS) {
  const to = el.getBoundingClientRect()
  if (!to.width || !to.height) return
  return gsap.fromTo(
    el,
    {
      x: from.left - to.left,
      y: from.top - to.top,
      scaleX: from.width / to.width,
      scaleY: from.height / to.height,
      transformOrigin: '0 0',
    },
    { x: 0, y: 0, scaleX: 1, scaleY: 1, duration, ease: 'power3.inOut', clearProps: 'transform' },
  )
}
