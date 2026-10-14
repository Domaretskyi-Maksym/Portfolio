<script setup lang="ts">
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import { MATERIAL_SAMPLES_ORIGIN } from '../../three/kinetic/layout'

/** A plinth of reference primitives — one per material in the library. */
const PLINTH_HEIGHT = 0.5

const { brushedSteel, plastic, frostedGlass } = useKineticMaterials()
</script>

<template>
  <TresGroup :position="MATERIAL_SAMPLES_ORIGIN">
    <TresMesh :material="plastic.graphite" :position="[0, PLINTH_HEIGHT / 2, 0]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[3.2, PLINTH_HEIGHT, 1.4]" />
    </TresMesh>

    <TresMesh :material="brushedSteel" :position="[-1.1, PLINTH_HEIGHT + 0.45, 0]" cast-shadow receive-shadow>
      <TresCylinderGeometry :args="[0.32, 0.32, 0.9, 64]" />
    </TresMesh>
    <TresMesh :material="plastic.red" :position="[-0.35, PLINTH_HEIGHT + 0.35, 0]" cast-shadow receive-shadow>
      <TresSphereGeometry :args="[0.35, 48, 32]" />
    </TresMesh>
    <TresMesh :material="plastic.blue" :position="[0.4, PLINTH_HEIGHT + 0.3, 0]" cast-shadow receive-shadow>
      <TresCylinderGeometry :args="[0.3, 0.3, 0.6, 48]" />
    </TresMesh>
    <TresMesh :material="frostedGlass" :position="[1.15, PLINTH_HEIGHT + 0.35, 0]" cast-shadow>
      <TresSphereGeometry :args="[0.35, 48, 32]" />
    </TresMesh>
  </TresGroup>
</template>
