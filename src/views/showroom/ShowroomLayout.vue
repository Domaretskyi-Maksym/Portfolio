<script setup lang="ts">
import CartDrawer from '../../components/showroom/CartDrawer.vue'
import FlyToCart from '../../components/showroom/FlyToCart.vue'
import ShopHeader from '../../components/showroom/ShopHeader.vue'
import ShowroomCanvas from '../../components/showroom/ShowroomCanvas.vue'
import { provideViewRegistry } from '../../composables/useProductView'

provideViewRegistry()
</script>

<template>
  <div class="min-h-screen bg-[#f4f3f0] text-zinc-900">
    <ShopHeader />
    <!-- Keyed by path (not query) so filtering the catalog doesn't replay the page transition. -->
    <RouterView v-slot="{ Component, route }">
      <Transition name="shop-page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
    <ShowroomCanvas />
    <FlyToCart />
    <CartDrawer />
  </div>
</template>

<style scoped>
.shop-page-enter-active,
.shop-page-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.shop-page-enter-from {
  opacity: 0;
}
.shop-page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
