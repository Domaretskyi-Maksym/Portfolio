import { inject, onBeforeUnmount, onMounted, provide, shallowRef, type InjectionKey, type Ref } from 'vue'
import { createViewRegistry, type ProductView, type ViewOptions, type ViewRegistry } from '../three/showroom/viewRegistry'

const VIEW_REGISTRY_KEY: InjectionKey<ViewRegistry> = Symbol('showroom-views')
/** Radians of turn per dragged pixel on the product page. */
const DRAG_SENSITIVITY = 0.012
const MAX_SPIN = 9

export function provideViewRegistry(): ViewRegistry {
  const registry = createViewRegistry()
  provide(VIEW_REGISTRY_KEY, registry)
  return registry
}

export function useViewRegistry(): ViewRegistry {
  const registry = inject(VIEW_REGISTRY_KEY)
  if (!registry) throw new Error('useViewRegistry() must be used inside the showroom layout')
  return registry
}

interface UseProductViewOptions extends Omit<ViewOptions, 'el'> {
  /** Element that receives hover/drag (defaults to the view element itself). */
  interactionEl?: Ref<HTMLElement | null | undefined>
  /** Hero views can be spun by dragging. */
  draggable?: boolean
}

/**
 * Registers `el` as a view of the shared showroom canvas — the HTML element only reserves the
 * space, the 3D model is painted into its rectangle. Pointer input is read from the DOM, so the
 * canvas itself never needs to receive events.
 */
export function useProductView(el: Ref<HTMLElement | null | undefined>, options: UseProductViewOptions) {
  const registry = useViewRegistry()
  const view = shallowRef<ProductView | null>(null)
  let target: HTMLElement | null = null
  let lastX = 0
  let lastMoveAt = 0

  function updatePointer(event: PointerEvent) {
    const current = view.value
    if (!current) return
    const rect = current.el.getBoundingClientRect()
    current.pointer.set(
      Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1)),
      Math.max(-1, Math.min(1, -(((event.clientY - rect.top) / rect.height) * 2 - 1))),
    )
  }

  function onEnter(event: PointerEvent) {
    if (event.pointerType === 'touch' || !view.value) return
    view.value.hovered = true
    updatePointer(event)
  }

  function onMove(event: PointerEvent) {
    const current = view.value
    if (!current) return
    if (event.pointerType !== 'touch') updatePointer(event)
    if (current.dragging) {
      const now = performance.now()
      const delta = (event.clientX - lastX) * DRAG_SENSITIVITY
      current.dragYaw += delta
      const elapsed = Math.max((now - lastMoveAt) / 1000, 1 / 120)
      current.spinVelocity = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, delta / elapsed))
      lastX = event.clientX
      lastMoveAt = now
    }
  }

  function onLeave() {
    const current = view.value
    if (!current || current.dragging) return
    current.hovered = false
    current.pointer.set(0, 0)
  }

  function onDown(event: PointerEvent) {
    const current = view.value
    if (!current || !options.draggable || event.button !== 0) return
    current.dragging = true
    current.spinVelocity = 0
    lastX = event.clientX
    lastMoveAt = performance.now()
    target?.setPointerCapture(event.pointerId)
  }

  function onUp(event: PointerEvent) {
    const current = view.value
    if (!current?.dragging) return
    current.dragging = false
    if (performance.now() - lastMoveAt > 80) current.spinVelocity = 0
    if (target?.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
    if (event.pointerType === 'touch' || !target?.matches(':hover')) onLeave()
  }

  onMounted(() => {
    if (!el.value) return
    const { interactionEl, draggable: _draggable, ...viewOptions } = options
    view.value = registry.register({ ...viewOptions, el: el.value })
    target = interactionEl?.value ?? el.value
    target.addEventListener('pointerenter', onEnter)
    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerleave', onLeave)
    target.addEventListener('pointerdown', onDown)
    target.addEventListener('pointerup', onUp)
    target.addEventListener('pointercancel', onUp)
  })

  onBeforeUnmount(() => {
    if (view.value) registry.unregister(view.value)
    target?.removeEventListener('pointerenter', onEnter)
    target?.removeEventListener('pointermove', onMove)
    target?.removeEventListener('pointerleave', onLeave)
    target?.removeEventListener('pointerdown', onDown)
    target?.removeEventListener('pointerup', onUp)
    target?.removeEventListener('pointercancel', onUp)
    view.value = null
    target = null
  })

  return { view, registry }
}
