import { onBeforeUnmount, onMounted } from 'vue'
import { pointerState } from '../three/pointer'

/** Mirrors the window pointer into `pointerState` as NDC (-1..1). */
export function usePointerTracking() {
  const onMove = (event: PointerEvent) => {
    pointerState.ndc.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1)
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
