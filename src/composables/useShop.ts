import { computed, reactive, shallowRef, watch } from 'vue'
import { findProduct, type Colorway, type Product } from '../data/products'

export interface CartItem {
  productId: string
  colorwayId: string
  option: string
  quantity: number
}

export interface CartFlight {
  id: number
  productId: string
  /** Where the model starts its flight (the view it leaves from). */
  from: DOMRect
  item: Omit<CartItem, 'quantity'>
}

/** Rect of the model's view when navigating, so the next page can continue the motion from it. */
export interface ViewHandoff {
  productId: string
  rect: DOMRect
}

const CART_STORAGE_KEY = 'showroom-cart'

function loadCart(): CartItem[] {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]') as CartItem[]
    return Array.isArray(stored) ? stored.filter((item) => findProduct(item.productId)) : []
  } catch {
    return []
  }
}

const state = reactive({
  colorways: {} as Record<string, string>,
  exploded: {} as Record<string, boolean>,
  cart: loadCart(),
  flights: [] as CartFlight[],
  /** Incremented whenever a parcel lands, so the cart icon can react. */
  cartBumps: 0,
  drawerOpen: false,
})

watch(
  () => state.cart,
  (cart) => localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)),
  { deep: true },
)

const cartIcon = shallowRef<HTMLElement | null>(null)
let handoff: ViewHandoff | null = null
let catalogScroll = 0
let flightId = 0

const cartCount = computed(() => state.cart.reduce((sum, item) => sum + item.quantity, 0))
const cartTotal = computed(() =>
  state.cart.reduce((sum, item) => sum + (findProduct(item.productId)?.price ?? 0) * item.quantity, 0),
)

function colorwayOf(product: Product): Colorway {
  return product.colorways.find((colorway) => colorway.id === state.colorways[product.id]) ?? product.colorways[0]
}

function addToCart(item: Omit<CartItem, 'quantity'>) {
  const existing = state.cart.find(
    (entry) => entry.productId === item.productId && entry.colorwayId === item.colorwayId && entry.option === item.option,
  )
  if (existing) existing.quantity++
  else state.cart.push({ ...item, quantity: 1 })
}

/** Shared shop state: catalog ↔ product page hand-offs, configurator choices and the cart. */
export function useShop() {
  return {
    state,
    cartIcon,
    cartCount,
    cartTotal,
    colorwayOf,
    selectColorway(productId: string, colorwayId: string) {
      state.colorways[productId] = colorwayId
    },
    setExploded(productId: string, exploded: boolean) {
      state.exploded[productId] = exploded
    },
    addToCart,
    setQuantity(index: number, quantity: number) {
      if (quantity <= 0) state.cart.splice(index, 1)
      else if (state.cart[index]) state.cart[index].quantity = quantity
    },
    /** Packs the product into a parcel that flies from `from` into the header cart. */
    flyToCart(item: Omit<CartItem, 'quantity'>, from: DOMRect) {
      state.flights.push({ id: ++flightId, productId: item.productId, from, item })
    },
    landFlight(id: number) {
      const index = state.flights.findIndex((flight) => flight.id === id)
      if (index === -1) return
      const [flight] = state.flights.splice(index, 1)
      addToCart(flight.item)
      state.cartBumps++
    },
    setHandoff(value: ViewHandoff | null) {
      handoff = value
    },
    /** Consumes the hand-off if it belongs to `productId`. */
    takeHandoff(productId: string): DOMRect | null {
      if (handoff?.productId !== productId) return null
      const { rect } = handoff
      handoff = null
      return rect
    },
    peekHandoff: () => handoff,
    saveCatalogScroll() {
      catalogScroll = window.scrollY
    },
    restoreCatalogScroll() {
      window.scrollTo({ top: catalogScroll, behavior: 'instant' })
    },
  }
}
