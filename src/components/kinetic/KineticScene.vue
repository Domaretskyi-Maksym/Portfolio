<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { PCFShadowMap } from 'three'
import { usePointerTracking } from '../../composables/usePointerTracking'
import KineticEffects from './KineticEffects.vue'
import KineticWorld from './KineticWorld.vue'

const BACKGROUND = '#1d1e22'

usePointerTracking()
</script>

<template>
  <TresCanvas
    :clear-color="BACKGROUND"
    :dpr="[1, 1.5]"
    :antialias="false"
    shadows
    :shadow-map-type="PCFShadowMap"
    power-preference="high-performance"
  >
    <TresFog :args="[BACKGROUND, 18, 42]" attach="fog" />
    <KineticWorld />
    <KineticEffects />
  </TresCanvas>
</template>
