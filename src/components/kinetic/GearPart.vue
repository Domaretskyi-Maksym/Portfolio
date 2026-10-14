<script setup lang="ts">
import { onUnmounted } from 'vue'
import { useHoverGlow } from '../../composables/useHoverGlow'
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import { useMechanism } from '../../composables/useMechanism'
import { createGearDetailGeometry, createGearGeometry, gearPitchRadius } from '../../three/kinetic/gearGeometry'
import { GEAR_MODULE, GEAR_THICKNESS, type GearPlacement } from '../../three/kinetic/gearTrain'
import { BAUHAUS, cloneWithEmissive } from '../../three/kinetic/materials'
import type { PartMotion, Vec3 } from '../../three/kinetic/types'
import KinematicPart from './KinematicPart.vue'

const props = defineProps<{ gear: GearPlacement }>()

/** Gear geometry is built along +Y; this stands it up facing +Z. */
const FACE_FORWARD: Vec3 = [Math.PI / 2, 0, 0]
const AXLE_LENGTH = 1

const { plastic, brushedSteel, darkSteel } = useKineticMaterials()
const { state } = useMechanism()

const shape = { teeth: props.gear.teeth, module: GEAR_MODULE, thickness: GEAR_THICKNESS }
const geometry = createGearGeometry(shape)
const detailGeometry = createGearDetailGeometry(shape)

const { finish } = props.gear
const material =
  finish === 'steel'
    ? cloneWithEmissive(brushedSteel, BAUHAUS.yellow)
    : cloneWithEmissive(plastic[finish], BAUHAUS[finish])
const motion: PartMotion = { kind: 'spin', ratio: props.gear.ratio, phase: props.gear.phase }
const axleRadius = Math.min(0.14, gearPitchRadius(props.gear.teeth, GEAR_MODULE) * 0.16)

const glow = useHoverGlow(material, {
  cursor: 'grab',
  onChange: (hovered) => {
    state.hoveredGears += hovered ? 1 : -1
  },
})

onUnmounted(() => {
  geometry.dispose()
  detailGeometry.dispose()
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
        :geometry="detailGeometry"
        :material="finish === 'steel' ? darkSteel : brushedSteel"
        :rotation="FACE_FORWARD"
        pointerEvents="none"
        cast-shadow
        receive-shadow
      />
      <TresMesh
        :material="darkSteel"
        :rotation="FACE_FORWARD"
        :position="[0, 0, -AXLE_LENGTH / 2 + GEAR_THICKNESS / 2]"
        pointerEvents="none"
        cast-shadow
      >
        <TresCylinderGeometry :args="[axleRadius, axleRadius, AXLE_LENGTH, 24]" />
      </TresMesh>
    </TresGroup>
  </KinematicPart>
</template>
