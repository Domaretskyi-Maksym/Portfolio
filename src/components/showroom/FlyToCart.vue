<script setup lang="ts">
import { useShop } from '../../composables/useShop'
import CartFlight from './CartFlight.vue'

const shop = useShop()
</script>

<template>
  <CartFlight v-for="flight in shop.state.flights" :key="flight.id" :flight="flight" @landed="shop.landFlight(flight.id)" />
</template>
