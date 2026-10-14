<script setup lang="ts">
import gsap from 'gsap'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useProductView } from '../../composables/useProductView'
import { useShop, type CartFlight } from '../../composables/useShop'

const props = defineProps<{ flight: CartFlight }>()
const emit = defineEmits<{ landed: [] }>()

/** Time the model spends packing itself into a parcel before taking off. */
const PACK_SECONDS = 0.38
const FLIGHT_SECONDS = 0.85
const ARC_HEIGHT = 220
const LANDED_SIZE = 34

const shop = useShop()
const el = ref<HTMLElement | null>(null)
const { registry } = useProductView(el, { productId: props.flight.productId, mode: 'flight', clip: false, visible: true })
let timeline: gsap.core.Timeline | null = null

onMounted(() => {
  const node = el.value
  if (!node) return
  const from = props.flight.from
  const startSize = Math.min(from.width, from.height)
  const start = { x: from.left + from.width / 2, y: from.top + from.height / 2 }
  const cart = shop.cartIcon.value?.getBoundingClientRect()
  const end = cart ? { x: cart.left + cart.width / 2, y: cart.top + cart.height / 2 } : { x: window.innerWidth - 40, y: 32 }
  const control = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - ARC_HEIGHT }

  const place = (t: number) => {
    const u = 1 - t
    const x = u * u * start.x + 2 * u * t * control.x + t * t * end.x
    const y = u * u * start.y + 2 * u * t * control.y + t * t * end.y
    const size = gsap.utils.interpolate(startSize, LANDED_SIZE, t)
    gsap.set(node, { x: x - size / 2, y: y - size / 2, width: size, height: size })
  }

  const progress = { t: 0 }
  place(0)
  timeline = gsap
    .timeline({
      onComplete: () => {
        registry.regrow(props.flight.productId)
        emit('landed')
      },
    })
    .to(progress, { t: 1, duration: FLIGHT_SECONDS, ease: 'power2.in', onUpdate: () => place(progress.t) }, PACK_SECONDS)
})

onBeforeUnmount(() => timeline?.kill())
</script>

<template>
  <div ref="el" class="pointer-events-none fixed top-0 left-0" aria-hidden="true" />
</template>
