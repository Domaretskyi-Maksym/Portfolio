<script setup lang="ts">
import {
  DepthOfFieldPmndrs,
  EffectComposerPmndrs,
  N8AOPmndrs,
  TiltShiftPmndrs,
  ToneMappingPmndrs,
  VignettePmndrs,
} from '@tresjs/post-processing'
import { ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing'
import { shallowRef, watch } from 'vue'
import { cameraFocus } from '../../three/kinetic/layout'

/** Exposed refs are unwrapped on the component instance. */
const dofRef = shallowRef<{ effect: DepthOfFieldEffect | null }>()

// Pointing the effect at a world-space target makes it refocus on whatever the camera looks at.
watch(
  () => dofRef.value?.effect,
  (effect) => {
    if (effect) effect.target = cameraFocus
  },
  { immediate: true },
)
</script>

<template>
  <EffectComposerPmndrs :multisampling="0">
    <N8AOPmndrs :ao-radius="1.2" :distance-falloff="1" :intensity="2.5" :ao-samples="16" :denoise-samples="8" half-res />
    <DepthOfFieldPmndrs ref="dofRef" :world-focus-range="5" :bokeh-scale="2.2" :resolution-scale="0.5" />
    <TiltShiftPmndrs :focus-area="0.8" :feather="0.25" :kernel-size="1" />
    <ToneMappingPmndrs :mode="ToneMappingMode.AGX" />
    <VignettePmndrs :offset="0.3" :darkness="0.55" />
  </EffectComposerPmndrs>
</template>
