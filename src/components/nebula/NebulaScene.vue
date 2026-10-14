<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import {
  BloomPmndrs,
  ChromaticAberrationPmndrs,
  EffectComposerPmndrs,
  VignettePmndrs,
} from '@tresjs/post-processing'
import { Vector2 } from 'three'
import { usePointerTracking } from '../../composables/usePointerTracking'
import CameraController from './CameraController.vue'
import NebulaCore from './NebulaCore.vue'
import ProjectNodes from './ProjectNodes.vue'

const CHROMATIC_OFFSET = new Vector2(0.0007, 0.0007)

usePointerTracking()
</script>

<template>
  <TresCanvas
    clear-color="#02030a"
    :dpr="[1, 2]"
    :antialias="false"
    power-preference="high-performance"
  >
    <CameraController />
    <NebulaCore />
    <ProjectNodes />

    <EffectComposerPmndrs>
      <BloomPmndrs :intensity="1.5" :luminance-threshold="0.2" :luminance-smoothing="0.3" mipmap-blur />
      <ChromaticAberrationPmndrs :offset="CHROMATIC_OFFSET" radial-modulation :modulation-offset="0.15" />
      <VignettePmndrs :offset="0.25" :darkness="0.75" />
    </EffectComposerPmndrs>
  </TresCanvas>
</template>
