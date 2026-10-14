<script setup lang="ts">
import { onUnmounted } from 'vue'
import { useHoverGlow } from '../../composables/useHoverGlow'
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import { useMechanism } from '../../composables/useMechanism'
import { createGearGeometry, gearPitchRadius } from '../../three/kinetic/gearGeometry'
import { GEAR_MODULE, GEAR_THICKNESS, type GearPlacement } from '../../three/kinetic/gearTrain'
import { BAUHAUS, cloneWithEmissive } from '../../three/kinetic/materials'
import type { PartMotion } from '../../three/kinetic/types'
import KinematicPart from './KinematicPart.vue'

const props = defineProps<{ gear: GearPlacement }>()

/** Gear geometry is built along +Y; this stands it up facing +Z. */
const FACE_FORWARD: [number, number, number] = [Math.PI / 2, 0, 0]
const AXLE_LENGTH = 0.9

const { plastic, brushedSteel } = useKineticMaterials()
const { state } = useMechanism()

const geometry = createGearGeometry({ teeth: props.gear.teeth, module: GEAR_MODULE, thickness: GEAR_THICKNESS })
const { finish } = props.gear
const material =
  finish === 'steel'
    ? cloneWithEmissive(brushedSteel, BAUHAUS.yellow)
    : cloneWithEmissive(plastic[finish], BAUHAUS[finish])
const motion: PartMotion = { kind: 'spin', ratio: props.gear.ratio, phase: props.gear.phase }
const axleRadius = Math.min(0.09, gearPitchRadius(props.gear.teeth, GEAR_MODULE) * 0.12)

const glow = useHoverGlow(material, {
  cursor: 'grab',
  onChange: (hovered) => {
    state.hoveredGears += hovered ? 1 : -1
  },
})

onUnmounted(() => {
  geometry.dispose()
  material.dispose()
})
</script>

<template>
  <KinematicPart :position="gear.position" :explode-offset="gear.explodeOffset" :motion="motion" collider="cylinder">
    <TresMesh
      :geometry="geometry"
      :material="material"
      :rotation="FACE_FORWARD"
      cast-shadow
      receive-shadow
      @pointerover="glow.onPointerOver"
      @pointerout="glow.onPointerOut"
    />
    <TresGroup>
      <TresMesh
        :material="brushedSteel"
        :rotation="FACE_FORWARD"
        :position="[0, 0, -AXLE_LENGTH / 2 + GEAR_THICKNESS / 2]"
        cast-shadow
      >
        <TresCylinderGeometry :args="[axleRadius, axleRadius, AXLE_LENGTH, 16]" />
      </TresMesh>
    </TresGroup>
  </KinematicPart>
</template>
