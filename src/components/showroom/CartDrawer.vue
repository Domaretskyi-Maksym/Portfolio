<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useShop } from '../../composables/useShop'
import { findProduct, formatPrice } from '../../data/products'

const shop = useShop()
const closeEl = ref<HTMLButtonElement | null>(null)

const lines = computed(() =>
  shop.state.cart.flatMap((item, index) => {
    const product = findProduct(item.productId)
    if (!product) return []
    const colorway = product.colorways.find((entry) => entry.id === item.colorwayId) ?? product.colorways[0]
    return [{ index, item, product, colorway }]
  }),
)

function close() {
  shop.state.drawerOpen = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && shop.state.drawerOpen) close()
}

watch(
  () => shop.state.drawerOpen,
  async (open) => {
    if (!open) return
    await nextTick()
    closeEl.value?.focus()
  },
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Transition name="backdrop">
    <div v-if="shop.state.drawerOpen" class="fixed inset-0 z-40 bg-zinc-900/30 backdrop-blur-sm" @click="close" />
  </Transition>
  <Transition name="drawer">
    <aside
      v-if="shop.state.drawerOpen"
      class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-title"
    >
      <header class="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
        <h2 id="cart-title" class="text-lg font-semibold text-zinc-900">Кошик</h2>
        <button
          ref="closeEl"
          type="button"
          class="grid size-9 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          aria-label="Закрити кошик"
          @click="close"
        >
          <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
          </svg>
        </button>
      </header>

      <p v-if="!lines.length" class="flex-1 px-6 py-16 text-center text-sm text-zinc-500">Кошик порожній — додайте щось гарне.</p>

      <ul v-else class="flex-1 divide-y divide-zinc-100 overflow-y-auto px-6">
        <li v-for="line in lines" :key="`${line.item.productId}-${line.item.colorwayId}-${line.item.option}`" class="flex gap-4 py-5">
          <span class="size-16 shrink-0 rounded-2xl shadow-inner" :style="{ background: `linear-gradient(135deg, ${line.colorway.swatch}, #f4f3f0)` }" />
          <div class="min-w-0 flex-1">
            <p class="font-medium text-zinc-900">{{ line.product.name }}</p>
            <p class="text-sm text-zinc-500">{{ line.colorway.name }} · {{ line.item.option }}</p>
            <div class="mt-3 flex items-center gap-2">
              <button
                type="button"
                class="grid size-7 place-items-center rounded-full border border-zinc-200 text-zinc-600 transition hover:border-zinc-900"
                :aria-label="`Зменшити кількість ${line.product.name}`"
                @click="shop.setQuantity(line.index, line.item.quantity - 1)"
              >
                −
              </button>
              <span class="w-6 text-center text-sm font-medium tabular-nums">{{ line.item.quantity }}</span>
              <button
                type="button"
                class="grid size-7 place-items-center rounded-full border border-zinc-200 text-zinc-600 transition hover:border-zinc-900"
                :aria-label="`Збільшити кількість ${line.product.name}`"
                @click="shop.setQuantity(line.index, line.item.quantity + 1)"
              >
                +
              </button>
            </div>
          </div>
          <p class="font-medium text-zinc-900 tabular-nums">{{ formatPrice(line.product.price * line.item.quantity) }}</p>
        </li>
      </ul>

      <footer class="border-t border-zinc-100 px-6 py-5">
        <div class="mb-4 flex justify-between text-base font-semibold text-zinc-900">
          <span>Разом</span>
          <span class="tabular-nums">{{ formatPrice(shop.cartTotal.value) }}</span>
        </div>
        <button
          type="button"
          class="w-full rounded-full bg-zinc-900 py-4 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!lines.length"
        >
          Оформити замовлення
        </button>
      </footer>
    </aside>
  </Transition>
</template>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>
