<script setup lang="ts">
import { Environment } from '@tresjs/cientos'
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
const FLOOR_ROTATION: Vec3 = [-Math.PI / 2, 0, 0]
</script>

<template>
  <ScrollController />

  <TresAmbientLight :intensity="0.15" />
  <TresDirectionalLight
    :position="KEY_LIGHT_POSITION"
    :intensity="2.2"
    cast-shadow
    :shadow-mapSize-width="SHADOW_MAP_SIZE"
    :shadow-mapSize-height="SHADOW_MAP_SIZE"
    :shadow-camera-left="-20"
    :shadow-camera-right="20"
    :shadow-camera-top="14"
    :shadow-camera-bottom="-14"
    :shadow-camera-near="1"
    :shadow-camera-far="40"
    :shadow-radius="4"
    :shadow-bias="-0.0004"
    :shadow-normalBias="0.02"
  />

  <!-- Separate boundary: a slow HDR download must not hold back the machine. -->
  <Suspense>
    <Environment preset="studio" :environment-intensity="0.35" />
  </Suspense>

  <TresMesh :rotation="FLOOR_ROTATION" :position="[0, FLOOR_Y, 0]" receive-shadow>
    <TresPlaneGeometry :args="[80, 80]" />
    <TresMeshStandardMaterial color="#26272c" :roughness="0.9" :metalness="0" />
  </TresMesh>

  <Suspense>
    <CoreMechanism />
  </Suspense>
  <FloatingShapes />
  <MaterialSamples />
  <ConveyorNode />
  <ScreensNode />
</template>
