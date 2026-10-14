<script setup lang="ts">
import { Environment, Lightformer } from '@tresjs/cientos'
import { provideKineticMaterials } from '../../composables/useKineticMaterials'
import { provideMechanism } from '../../composables/useMechanism'
import { FLOOR_Y } from '../../three/kinetic/layout'
import type { Vec3 } from '../../three/kinetic/types'
import ConveyorNode from './ConveyorNode.vue'
import CoreMechanism from './CoreMechanism.vue'
import FloatingShapes from './FloatingShapes.vue'
import MaterialSamples from './MaterialSamples.vue'
import ScreensNode from './ScreensNode.vue'
import ScrollController from './ScrollController.vue'

/** Lives inside TresCanvas so the providers are reachable from every scene node. */
provideKineticMaterials()
provideMechanism()

const KEY_LIGHT_POSITION: Vec3 = [4, 12, 10]
const SHADOW_MAP_SIZE = 2048
/** VSM blur: wide radius + many samples → soft, studio-like penumbrae. */
const SHADOW_RADIUS = 9
const SHADOW_BLUR_SAMPLES = 20
const FLOOR_ROTATION: Vec3 = [-Math.PI / 2, 0, 0]
</script>

<template>
  <ScrollController />

  <TresAmbientLight :intensity="0.06" />
  <TresDirectionalLight
    :position="KEY_LIGHT_POSITION"
    :intensity="2.4"
    cast-shadow
    :shadow-mapSize-width="SHADOW_MAP_SIZE"
    :shadow-mapSize-height="SHADOW_MAP_SIZE"
    :shadow-camera-left="-20"
    :shadow-camera-right="20"
    :shadow-camera-top="14"
    :shadow-camera-bottom="-14"
    :shadow-camera-near="1"
    :shadow-camera-far="40"
    :shadow-radius="SHADOW_RADIUS"
    :shadow-blurSamples="SHADOW_BLUR_SAMPLES"
    :shadow-bias="-0.0006"
  />
  <!-- Cool rim from behind-left separates silhouettes from the dark backdrop. -->
  <TresDirectionalLight :position="[-9, 6, -8]" :intensity="0.9" color="#b9c8ff" />

  <!--
    Invisible HDRI: the studio preset plus custom softboxes, used only for reflections.
    Separate Suspense boundary so a slow HDR download never holds back the machine.
  -->
  <Suspense>
    <Environment preset="studio" :environment-intensity="0.75" :resolution="256">
      <Lightformer form="rect" :intensity="2.2" :position="[0, 9, 3]" :rotation="[Math.PI / 2, 0, 0]" :scale="[14, 5, 1]" />
      <Lightformer form="rect" :intensity="3" :position="[-9, 2, 4]" :rotation="[0, Math.PI / 2, 0]" :scale="[1.2, 10, 1]" />
      <Lightformer form="rect" :intensity="1.6" :position="[9, 3, -3]" :rotation="[0, -Math.PI / 2, 0]" :scale="[2, 8, 1]" color="#cfe0ff" />
      <Lightformer form="ring" :intensity="2" :position="[2, 1, 12]" :scale="[3.5, 3.5, 1]" />
    </Environment>
  </Suspense>

  <TresMesh :rotation="FLOOR_ROTATION" :position="[0, FLOOR_Y, 0]" receive-shadow>
    <TresPlaneGeometry :args="[80, 80]" />
    <TresMeshStandardMaterial color="#26272c" :roughness="0.85" :metalness="0" />
  </TresMesh>

  <Suspense>
    <CoreMechanism />
  </Suspense>
  <FloatingShapes />
  <MaterialSamples />
  <ConveyorNode />
  <ScreensNode />
</template>
