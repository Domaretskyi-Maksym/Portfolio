import { onBeforeUnmount, onMounted } from 'vue'
import { pointerState } from '../three/pointer'

const MAX_SPEED = 8

/** Mirrors the window pointer into `pointerState` as NDC (-1..1) plus speed in NDC units/sec. */
export function usePointerTracking() {
  const onMove = (event: PointerEvent) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1
    const y = -(event.clientY / window.innerHeight) * 2 + 1
    const now = performance.now()

    if (pointerState.active) {
      const dt = Math.max(now - pointerState.lastMoveAt, 1) / 1000
      const distance = Math.hypot(x - pointerState.ndc.x, y - pointerState.ndc.y)
      pointerState.speed = Math.min(distance / dt, MAX_SPEED)
    }

    pointerState.ndc.set(x, y)
    pointerState.lastMoveAt = now
    pointerState.active = true
  }

  const onLeave = () => {
    pointerState.active = false
  }

  onMounted(() => {
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pointermove', onMove)
    document.documentElement.removeEventListener('pointerleave', onLeave)
  })
}
