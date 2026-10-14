<script setup lang="ts">
import {
  BloomPmndrs,
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
    <!-- Contact shadows in tight gaps (gear teeth, bolts, plate seams). -->
    <N8AOPmndrs
      :ao-radius="0.85"
      :distance-falloff="0.6"
      :intensity="3.2"
      :ao-samples="24"
      :denoise-samples="8"
      :denoise-radius="10"
      color="#05060a"
      half-res
    />
    <!-- Macro lens: narrow focus band around the focused part, heavy bokeh in front and behind. -->
    <DepthOfFieldPmndrs ref="dofRef" :world-focus-range="2.4" :bokeh-scale="4.5" :resolution-scale="0.5" />
    <!-- HDR bloom: only emissive/LED surfaces brighter than 1.0 glow. -->
    <BloomPmndrs :intensity="0.9" :luminance-threshold="1" :luminance-smoothing="0.25" mipmap-blur />
    <TiltShiftPmndrs :focus-area="0.82" :feather="0.22" :kernel-size="1" />
    <ToneMappingPmndrs :mode="ToneMappingMode.AGX" />
    <VignettePmndrs :offset="0.3" :darkness="0.6" />
  </EffectComposerPmndrs>
</template>
