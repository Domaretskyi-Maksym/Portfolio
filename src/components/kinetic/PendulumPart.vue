<script setup lang="ts">
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import type { PartMotion, Vec3 } from '../../three/kinetic/types'
import KinematicPart from './KinematicPart.vue'

/** Escapement pendulum hanging from `pivot`, swinging in sync with the master shaft. */
defineProps<{ pivot: Vec3 }>()

const ROD_LENGTH = 2.3
const BOB_RADIUS = 0.32
const MOTION: PartMotion = { kind: 'swing', amplitude: 0.32, frequency: 5 }
const EXPLODE_OFFSET: Vec3 = [1.4, 0.6, 1.6]

const { brushedSteel, plastic } = useKineticMaterials()
</script>

<template>
  <KinematicPart :position="pivot" :explode-offset="EXPLODE_OFFSET" :motion="MOTION">
    <TresMesh :material="brushedSteel" cast-shadow>
      <TresSphereGeometry :args="[0.14, 24, 16]" />
    </TresMesh>
    <TresGroup>
      <TresMesh :material="brushedSteel" :position="[0, -ROD_LENGTH / 2, 0]" cast-shadow>
        <TresCylinderGeometry :args="[0.045, 0.045, ROD_LENGTH, 12]" />
      </TresMesh>
      <TresMesh :material="plastic.blue" :position="[0, -ROD_LENGTH - BOB_RADIUS + 0.12, 0]" cast-shadow receive-shadow>
        <TresSphereGeometry :args="[BOB_RADIUS, 32, 24]" />
      </TresMesh>
    </TresGroup>
  </KinematicPart>
</template>
