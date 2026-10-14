<script setup lang="ts">
import { computed } from 'vue'
import { useShop } from '../../composables/useShop'
import type { Product } from '../../data/products'

const props = withDefaults(defineProps<{ product: Product; size?: 'sm' | 'lg' }>(), { size: 'sm' })

const shop = useShop()
const selected = computed(() => shop.colorwayOf(props.product).id)
</script>

<template>
  <div class="flex items-center gap-2" role="radiogroup" :aria-label="`Колір ${product.name}`">
    <button
      v-for="colorway in product.colorways"
      :key="colorway.id"
      type="button"
      role="radio"
      :aria-checked="selected === colorway.id"
      :aria-label="colorway.name"
      :title="colorway.name"
      class="rounded-full ring-offset-2 ring-offset-white transition focus-visible:outline-none"
      :class="[
        size === 'lg' ? 'size-9' : 'size-5',
        selected === colorway.id ? 'ring-2 ring-zinc-900' : 'ring-1 ring-black/10 hover:ring-zinc-400',
      ]"
      :style="{ background: colorway.swatch }"
      @click.stop.prevent="shop.selectColorway(product.id, colorway.id)"
    />
  </div>
</template>
