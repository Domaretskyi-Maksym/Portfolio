<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useViewRegistry } from '../../composables/useProductView'
import { useShop } from '../../composables/useShop'
import { useSpring } from '../../composables/useSpring'

/** Rotation (deg/s) and scale (1/s) kicks given to the cart icon when a parcel lands. */
const LANDING_SPIN = 300
const LANDING_SQUASH = 5

const shop = useShop()
const registry = useViewRegistry()
const headerEl = ref<HTMLElement | null>(null)
const cartEl = ref<HTMLElement | null>(null)

const tilt = useSpring({ stiffness: 420, damping: 9 })
const squash = useSpring({ stiffness: 520, damping: 14 })
const cartTransform = computed(() => `rotate(${tilt.value.value}deg) scale(${1 + squash.value.value})`)

watch(
  () => shop.state.cartBumps,
  () => {
    tilt.impulse(LANDING_SPIN * (Math.random() < 0.5 ? -1 : 1))
    squash.impulse(LANDING_SQUASH)
  },
)

onMounted(() => {
  registry.clipEl = headerEl.value
  shop.cartIcon.value = cartEl.value
})

onBeforeUnmount(() => {
  registry.clipEl = null
  shop.cartIcon.value = null
})
</script>

<template>
  <header ref="headerEl" class="fixed inset-x-0 top-0 z-20 border-b border-black/5 bg-[#f4f3f0]/85 backdrop-blur-xl">
    <nav class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8" aria-label="Навігація магазину">
      <RouterLink :to="{ name: 'catalog' }" class="text-sm font-black tracking-[0.3em] text-zinc-900 uppercase">Seamless</RouterLink>

      <ul class="hidden items-center gap-6 text-sm font-medium text-zinc-500 md:flex">
        <li><RouterLink :to="{ name: 'catalog' }" class="transition hover:text-zinc-900">Каталог</RouterLink></li>
        <li><RouterLink :to="{ name: 'catalog', query: { category: 'audio' } }" class="transition hover:text-zinc-900">Аудіо</RouterLink></li>
        <li><RouterLink :to="{ name: 'catalog', query: { category: 'watches' } }" class="transition hover:text-zinc-900">Годинники</RouterLink></li>
        <li><RouterLink to="/" class="transition hover:text-zinc-900">Портфоліо</RouterLink></li>
      </ul>

      <button
        ref="cartEl"
        type="button"
        class="relative grid size-11 place-items-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none"
        :style="{ transform: cartTransform }"
        :aria-label="`Кошик, товарів: ${shop.cartCount.value}`"
        @click="shop.state.drawerOpen = true"
      >
        <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M6 8h12l-1 12H7L6 8Z" stroke-linejoin="round" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke-linecap="round" />
        </svg>
        <Transition name="badge" mode="out-in">
          <span
            v-if="shop.cartCount.value"
            :key="shop.cartCount.value"
            class="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff5a36] px-1 text-[11px] font-bold"
          >
            {{ shop.cartCount.value }}
          </span>
        </Transition>
      </button>
    </nav>
  </header>
</template>

<style scoped>
.badge-enter-active {
  transition: transform 0.35s cubic-bezier(0.34, 1.8, 0.64, 1);
}
.badge-enter-from {
  transform: scale(0.2);
}
</style>
