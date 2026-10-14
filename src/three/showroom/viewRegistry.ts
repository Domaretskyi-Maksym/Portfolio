import { Vector2 } from 'three'

/**
 * - `card`: still in the catalog grid, comes alive on hover.
 * - `hero`: main object of the product page.
 * - `flight`: packed into a parcel on its way to the cart.
 */
export type ViewMode = 'card' | 'hero' | 'flight'

const PRIORITY: Record<ViewMode, number> = { card: 1, hero: 2, flight: 3 }

/**
 * A DOM rectangle the shared canvas renders one product into (the drei `<View>` idea).
 * The DOM side writes pointer state; the 3D side animates `presence`, `glow` and `spin`.
 */
export interface ProductView {
  readonly uid: number
  readonly productId: string
  readonly mode: ViewMode
  readonly el: HTMLElement
  /** Clip to the area below the header, so models never paint over it. */
  readonly clip: boolean
  /** Pointer inside the element, -1…1 on both axes (+y up). */
  readonly pointer: Vector2
  hovered: boolean
  dragging: boolean
  /** Accumulated manual rotation (hero drag) and its release velocity. */
  dragYaw: number
  spinVelocity: number
  /** 0…1 scale-in/out, chasing `presenceTarget` once `delay` has elapsed. */
  presence: number
  presenceTarget: number
  delay: number
  /** Flashlight strength. */
  glow: number
}

export interface ViewOptions {
  productId: string
  mode: ViewMode
  el: HTMLElement
  clip?: boolean
  /** Seconds before the model starts growing in. */
  delay?: number
  /** Start already fully visible (e.g. when taking over from another view mid-transition). */
  visible?: boolean
}

export interface ViewRegistry {
  register(options: ViewOptions): ProductView
  unregister(view: ProductView): void
  /** The view each product is currently rendered in: highest priority wins. */
  resolve(): Map<string, ProductView>
  /** Shrinks matching views away (e.g. the rest of the grid when a product opens). */
  dismiss(predicate: (view: ProductView) => boolean): void
  /** Re-plays the grow-in of a product's views (after its parcel lands in the cart). */
  regrow(productId: string): void
  /** Element whose bottom edge is the top of the clipped area (the header). */
  clipEl: HTMLElement | null
}

export function createViewRegistry(): ViewRegistry {
  const views = new Set<ProductView>()
  const resolved = new Map<string, ProductView>()
  let uid = 0

  return {
    clipEl: null,

    register({ productId, mode, el, clip = true, delay = 0, visible = false }) {
      const view: ProductView = {
        uid: ++uid,
        productId,
        mode,
        el,
        clip,
        pointer: new Vector2(),
        hovered: false,
        dragging: false,
        dragYaw: 0,
        spinVelocity: 0,
        presence: visible ? 1 : 0,
        presenceTarget: 1,
        delay,
        glow: 0,
      }
      views.add(view)
      return view
    },

    unregister(view) {
      views.delete(view)
    },

    resolve() {
      resolved.clear()
      for (const view of views) {
        const current = resolved.get(view.productId)
        if (!current || PRIORITY[view.mode] > PRIORITY[current.mode] || (PRIORITY[view.mode] === PRIORITY[current.mode] && view.uid > current.uid)) {
          resolved.set(view.productId, view)
        }
      }
      return resolved
    },

    dismiss(predicate) {
      views.forEach((view) => {
        if (predicate(view)) view.presenceTarget = 0
      })
    },

    regrow(productId) {
      views.forEach((view) => {
        if (view.productId === productId && view.mode !== 'flight') view.presence = 0
      })
    },
  }
}
