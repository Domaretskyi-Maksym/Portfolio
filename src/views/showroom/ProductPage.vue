<script setup lang="ts">
import gsap from 'gsap'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import ColorwayPicker from '../../components/showroom/ColorwayPicker.vue'
import { useProductView } from '../../composables/useProductView'
import { useShop } from '../../composables/useShop'
import { CATEGORY_LABELS, findProduct, formatPrice, MODEL_STRUCTURE } from '../../data/products'
import { flipFrom } from '../../three/showroom/flip'

const props = defineProps<{ id: string }>()

/** The route guard guarantees the product exists. */
const product = findProduct(props.id)!
const structure = MODEL_STRUCTURE[product.model]

const router = useRouter()
const shop = useShop()
const stageEl = ref<HTMLElement | null>(null)
const anchorEl = ref<HTMLElement | null>(null)
const infoEl = ref<HTMLElement | null>(null)
const configEl = ref<HTMLElement | null>(null)
const option = ref(product.option.values[0])

const colorway = computed(() => shop.colorwayOf(product))
const exploded = computed(() => !!shop.state.exploded[product.id])

/** Opened from a card: the model continues its flight from the card's rectangle. */
const arrivingFrom = shop.takeHandoff(product.id)
useProductView(anchorEl, { productId: product.id, mode: 'hero', interactionEl: stageEl, visible: !!arrivingFrom, draggable: true })

let intro: gsap.core.Timeline | null = null

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'instant' })
  if (arrivingFrom && anchorEl.value) flipFrom(anchorEl.value, arrivingFrom)

  intro = gsap.timeline({ delay: arrivingFrom ? 0.35 : 0.1, defaults: { duration: 0.7, ease: 'power3.out', stagger: 0.06 } })
  if (infoEl.value) intro.from(infoEl.value.children, { x: -40, opacity: 0 }, 0)
  if (configEl.value) intro.from(configEl.value.children, { x: 40, opacity: 0 }, 0.08)
})

onBeforeUnmount(() => intro?.kill())

onBeforeRouteLeave((to) => {
  if (to.name === 'catalog' && anchorEl.value) {
    shop.setHandoff({ productId: product.id, rect: anchorEl.value.getBoundingClientRect() })
  }
  shop.setExploded(product.id, false)
})

function cartItem() {
  return { productId: product.id, colorwayId: colorway.value.id, option: option.value }
}

function addToCart() {
  if (anchorEl.value) shop.flyToCart(cartItem(), anchorEl.value.getBoundingClientRect())
}

function buyNow() {
  shop.addToCart(cartItem())
  shop.state.drawerOpen = true
}

function back() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'catalog' })
}
</script>

<template>
  <main class="mx-auto grid max-w-7xl gap-8 px-5 pt-24 pb-20 sm:px-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,300px)] lg:items-center lg:gap-10">
    <section ref="infoEl" class="order-2 lg:order-1" aria-labelledby="product-title">
      <!-- Intro animates direct children, so elements with CSS transitions stay wrapped. -->
      <div class="mb-6">
        <button type="button" class="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900" @click="back">
          <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Каталог · {{ CATEGORY_LABELS[product.category] }}
        </button>
      </div>
      <p class="text-xs font-semibold tracking-[0.3em] text-[#ff5a36] uppercase">{{ product.tagline }}</p>
      <h1 id="product-title" class="mt-2 text-4xl font-semibold tracking-tight text-zinc-900">{{ product.name }}</h1>
      <p class="mt-4 leading-relaxed text-zinc-500">{{ product.description }}</p>
      <p class="mt-6 text-2xl font-semibold text-zinc-900 tabular-nums">{{ formatPrice(product.price) }}</p>

      <div class="mt-8">
        <h2 class="text-sm font-semibold text-zinc-900">Структура</h2>
        <Transition name="fade" mode="out-in">
          <ol v-if="exploded" key="parts" class="mt-3 space-y-2">
            <li v-for="(part, index) in structure" :key="part" class="flex items-center gap-3 text-sm text-zinc-600" :style="{ animationDelay: `${index * 60}ms` }">
              <span class="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white tabular-nums">{{ index + 1 }}</span>
              {{ part }}
            </li>
          </ol>
          <p v-else key="hint" class="mt-3 text-sm text-zinc-500">Натисніть «Структура», щоб розкласти товар на деталі.</p>
        </Transition>
      </div>
    </section>

    <div
      ref="stageEl"
      class="relative order-1 h-[clamp(380px,68vh,760px)] cursor-grab touch-pan-y select-none active:cursor-grabbing lg:order-2"
      role="img"
      :aria-label="`3D-модель ${product.name}, колір ${colorway.name}`"
    >
      <div class="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95),rgba(255,255,255,0)_70%)]" />
      <div ref="anchorEl" class="absolute inset-0" />
      <p class="pointer-events-none absolute inset-x-0 bottom-2 text-center text-xs text-zinc-400">Тягніть, щоб обернути</p>
    </div>

    <section ref="configEl" class="order-3 space-y-8" aria-label="Налаштування товару">
      <div>
        <h2 class="mb-3 text-sm font-semibold text-zinc-900">
          Колір: <span class="font-normal text-zinc-500">{{ colorway.name }}</span>
        </h2>
        <ColorwayPicker :product="product" size="lg" />
      </div>

      <fieldset>
        <legend class="mb-3 text-sm font-semibold text-zinc-900">{{ product.option.label }}</legend>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="value in product.option.values"
            :key="value"
            class="cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition has-focus-visible:ring-2 has-focus-visible:ring-zinc-900"
            :class="option === value ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'"
          >
            <input v-model="option" type="radio" class="sr-only" :name="`option-${product.id}`" :value="value" />
            {{ value }}
          </label>
        </div>
      </fieldset>

      <div>
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition"
          :class="exploded ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-900 hover:border-zinc-400'"
          :aria-pressed="exploded"
          @click="shop.setExploded(product.id, !exploded)"
        >
          Структура
          <span class="text-xs font-medium opacity-60">{{ exploded ? 'Зібрати' : 'Розкласти на деталі' }}</span>
        </button>
      </div>

      <div class="space-y-3">
        <button type="button" class="w-full rounded-full bg-zinc-900 py-4 text-sm font-semibold text-white shadow-xl shadow-zinc-900/20 transition hover:bg-zinc-700" @click="addToCart">
          Додати в кошик
        </button>
        <button type="button" class="w-full rounded-full border border-zinc-300 py-4 text-sm font-semibold text-zinc-900 transition hover:border-zinc-900" @click="buyNow">
          Купити зараз
        </button>
      </div>
      <p class="text-xs leading-relaxed text-zinc-500">Безкоштовна доставка від 3 000 грн · Повернення протягом 30 днів</p>
    </section>
  </main>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-active li {
  animation: part-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes part-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
}
</style>
