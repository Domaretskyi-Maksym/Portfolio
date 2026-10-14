<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useProductView } from '../../composables/useProductView'
import { useShop } from '../../composables/useShop'
import { CATEGORY_LABELS, formatPrice, type Product } from '../../data/products'
import { flipFrom } from '../../three/showroom/flip'
import ColorwayPicker from './ColorwayPicker.vue'

const props = defineProps<{ product: Product; index: number }>()

/** Delay between neighbouring cards growing in. */
const STAGGER_SECONDS = 0.07

const shop = useShop()
const cardEl = ref<HTMLElement | null>(null)
const anchorEl = ref<HTMLElement | null>(null)

/** Returning from the product page: this card's model flies back from the hero. */
const returningFrom = shop.takeHandoff(props.product.id)

useProductView(anchorEl, {
  productId: props.product.id,
  mode: 'card',
  interactionEl: cardEl,
  visible: !!returningFrom,
  delay: returningFrom ? 0 : props.index * STAGGER_SECONDS,
})

onMounted(async () => {
  if (!returningFrom) return
  // Wait for the catalog to restore its scroll position before measuring the destination.
  await nextTick()
  if (anchorEl.value) flipFrom(anchorEl.value, returningFrom)
})

function open(event: MouseEvent, navigate: (event?: MouseEvent) => unknown) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
  if (anchorEl.value) shop.setHandoff({ productId: props.product.id, rect: anchorEl.value.getBoundingClientRect() })
  navigate(event)
}

function quickAdd() {
  if (!anchorEl.value) return
  shop.flyToCart(
    { productId: props.product.id, colorwayId: shop.colorwayOf(props.product).id, option: props.product.option.values[0] },
    anchorEl.value.getBoundingClientRect(),
  )
}
</script>

<template>
  <article ref="cardEl" class="group">
    <RouterLink v-slot="{ href, navigate }" :to="{ name: 'product', params: { id: product.id } }" custom>
      <a :href="href" class="block rounded-[28px] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-4 focus-visible:outline-none" @click="open($event, navigate)">
        <div class="relative aspect-4/5">
          <div
            class="absolute inset-0 rounded-[28px] bg-linear-to-b from-white to-[#e7e4de] shadow-[inset_0_-30px_60px_-30px_rgba(0,0,0,0.08)] transition duration-500 group-hover:to-[#dfdbd3]"
          />
          <div ref="anchorEl" class="absolute inset-0" />
          <span
            v-if="product.badge"
            class="absolute top-4 left-4 rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold tracking-wide text-white"
          >
            {{ product.badge }}
          </span>
        </div>
        <div class="mt-4 flex items-start justify-between gap-3 px-1">
          <div>
            <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">{{ CATEGORY_LABELS[product.category] }}</p>
            <h3 class="mt-1 font-semibold text-zinc-900">{{ product.name }}</h3>
          </div>
          <p class="font-semibold text-zinc-900 tabular-nums">{{ formatPrice(product.price) }}</p>
        </div>
      </a>
    </RouterLink>
    <div class="mt-3 flex items-center justify-between px-1">
      <ColorwayPicker :product="product" />
      <button
        type="button"
        class="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
        :aria-label="`Додати ${product.name} у кошик`"
        @click="quickAdd"
      >
        + У кошик
      </button>
    </div>
  </article>
</template>
