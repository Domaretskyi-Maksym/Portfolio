<script setup lang="ts">
import { onUnmounted } from 'vue'
import { useHoverGlow } from '../../composables/useHoverGlow'
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import { useMechanism } from '../../composables/useMechanism'
import { BAUHAUS, cloneWithEmissive } from '../../three/kinetic/materials'
import type { PartMotion, Vec3 } from '../../three/kinetic/types'
import KinematicPart from './KinematicPart.vue'

/** The yellow cap on the main shaft — clicking it explodes / reassembles the machine. */
const props = defineProps<{ position: Vec3 }>()

const FACE_FORWARD: Vec3 = [Math.PI / 2, 0, 0]
const HUB_RADIUS = 0.5
const HUB_DEPTH = 0.32
const MOTION: PartMotion = { kind: 'spin', ratio: 1, phase: 0 }
const EXPLODE_OFFSET: Vec3 = [0, 0, 3.2]

const { plastic, brushedSteel } = useKineticMaterials()
const { toggleExplode } = useMechanism()

const material = cloneWithEmissive(plastic.yellow, BAUHAUS.yellow)
const glow = useHoverGlow(material, { intensity: 0.6 })

onUnmounted(() => material.dispose())
</script>

<template>
  <KinematicPart :position="props.position" :explode-offset="EXPLODE_OFFSET" :motion="MOTION" collider="cylinder">
    <TresMesh
      :material="material"
      :rotation="FACE_FORWARD"
      cast-shadow
      receive-shadow
      @pointerover="glow.onPointerOver"
      @pointerout="glow.onPointerOut"
      @click="toggleExplode"
    >
      <TresCylinderGeometry :args="[HUB_RADIUS, HUB_RADIUS, HUB_DEPTH, 48]" />
    </TresMesh>
    <TresGroup>
      <TresMesh :material="brushedSteel" :rotation="FACE_FORWARD" :position="[0, 0, HUB_DEPTH / 2]" cast-shadow>
        <TresCylinderGeometry :args="[0.16, 0.16, 0.08, 32]" />
      </TresMesh>
      <TresMesh :material="plastic.red" :position="[0.32, 0, HUB_DEPTH / 2]" cast-shadow>
        <TresBoxGeometry :args="[0.16, 0.08, 0.06]" />
      </TresMesh>
    </TresGroup>
  </KinematicPart>
</template>
