<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import ProductCard from '../../components/showroom/ProductCard.vue'
import { useViewRegistry } from '../../composables/useProductView'
import { useShop } from '../../composables/useShop'
import { CATEGORY_LABELS, products, type Category } from '../../data/products'

const SORTS = [
  { id: 'featured', label: 'Рекомендовані' },
  { id: 'price-asc', label: 'Спочатку дешевші' },
  { id: 'price-desc', label: 'Спочатку дорожчі' },
] as const
type SortId = (typeof SORTS)[number]['id']

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]

const route = useRoute()
const router = useRouter()
const shop = useShop()
const registry = useViewRegistry()

function queryList(value: LocationQueryValue | LocationQueryValue[] | undefined): string[] {
  return (Array.isArray(value) ? value : [value]).filter((entry): entry is string => !!entry)
}

const selectedCategories = computed(() =>
  queryList(route.query.category).filter((entry): entry is Category => entry in CATEGORY_LABELS),
)
const sort = computed<SortId>(() => SORTS.find((entry) => entry.id === route.query.sort)?.id ?? 'featured')

const visibleProducts = computed(() => {
  const filtered = selectedCategories.value.length
    ? products.filter((product) => selectedCategories.value.includes(product.category))
    : products
  if (sort.value === 'featured') return filtered
  const direction = sort.value === 'price-asc' ? 1 : -1
  return [...filtered].sort((a, b) => (a.price - b.price) * direction)
})

const countByCategory = (category: Category) => products.filter((product) => product.category === category).length

function updateQuery(patch: Record<string, string | string[] | undefined>) {
  router.replace({ query: { ...route.query, ...patch } })
}

function toggleCategory(category: Category) {
  const current = selectedCategories.value
  const next = current.includes(category) ? current.filter((entry) => entry !== category) : [...current, category]
  updateQuery({ category: next.length ? next : undefined })
}

function setSort(event: Event) {
  const value = (event.target as HTMLSelectElement).value as SortId
  updateQuery({ sort: value === 'featured' ? undefined : value })
}

/** Filtered-out cards shrink their models away while the HTML fades. */
function onCardLeave(el: Element) {
  registry.dismiss((view) => el.contains(view.el))
}

onBeforeRouteLeave((to) => {
  shop.saveCatalogScroll()
  const opening = to.name === 'product' ? shop.peekHandoff()?.productId : undefined
  registry.dismiss((view) => view.mode === 'card' && view.productId !== opening)
})

onMounted(() => shop.restoreCatalogScroll())
</script>

<template>
  <main class="mx-auto max-w-7xl px-5 pt-28 pb-24 sm:px-8">
    <header class="mb-12 max-w-2xl">
      <p class="text-xs font-semibold tracking-[0.3em] text-[#ff5a36] uppercase">Seamless Showroom</p>
      <h1 class="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">Розгляньте кожну деталь.</h1>
      <p class="mt-4 text-zinc-500">Наведіть на товар — він оживе. Відкрийте — і він стане головним героєм сторінки, без перезавантажень.</p>
    </header>

    <div class="flex flex-col gap-10 lg:flex-row">
      <aside class="shrink-0 lg:w-56" aria-label="Фільтри">
        <h2 class="mb-4 text-sm font-semibold text-zinc-900">Категорії</h2>
        <ul class="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          <li v-for="category in CATEGORIES" :key="category">
            <label
              class="flex cursor-pointer items-center gap-3 rounded-full border px-4 py-2 text-sm transition lg:rounded-xl lg:border-transparent lg:px-3"
              :class="selectedCategories.includes(category) ? 'border-zinc-900 bg-zinc-900 text-white lg:bg-zinc-900' : 'border-zinc-200 text-zinc-600 hover:bg-white'"
            >
              <input type="checkbox" class="sr-only" :checked="selectedCategories.includes(category)" @change="toggleCategory(category)" />
              <span class="flex-1">{{ CATEGORY_LABELS[category] }}</span>
              <span class="text-xs opacity-60 tabular-nums">{{ countByCategory(category) }}</span>
            </label>
          </li>
        </ul>

        <label for="catalog-sort" class="mt-8 mb-2 block text-sm font-semibold text-zinc-900">Сортування</label>
        <select
          id="catalog-sort"
          class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          :value="sort"
          @change="setSort"
        >
          <option v-for="option in SORTS" :key="option.id" :value="option.id">{{ option.label }}</option>
        </select>

        <button
          v-if="selectedCategories.length || sort !== 'featured'"
          type="button"
          class="mt-4 text-sm font-medium text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline"
          @click="updateQuery({ category: undefined, sort: undefined })"
        >
          Скинути фільтри
        </button>
      </aside>

      <section class="min-w-0 flex-1" aria-label="Товари">
        <p class="mb-6 text-sm text-zinc-500">{{ visibleProducts.length }} товарів</p>
        <TransitionGroup name="grid" tag="ul" class="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3" @leave="onCardLeave">
          <li v-for="(product, index) in visibleProducts" :key="product.id">
            <ProductCard :product="product" :index="index" />
          </li>
        </TransitionGroup>
      </section>
    </div>
  </main>
</template>

<style scoped>
.grid-move {
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}
.grid-enter-active,
.grid-leave-active {
  transition: opacity 0.3s ease;
}
.grid-enter-from,
.grid-leave-to {
  opacity: 0;
}
</style>
