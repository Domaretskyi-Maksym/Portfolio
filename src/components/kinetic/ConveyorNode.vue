<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { MeshStandardMaterial, type Object3D } from 'three'
import { onUnmounted, shallowRef } from 'vue'
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import { useMechanism } from '../../composables/useMechanism'
import {
  BELT_LENGTH,
  BELT_SPEED,
  BELT_THICKNESS,
  BELT_WIDTH,
  FLOOR_LOCAL_Y,
  GATE_ARGS,
  GATE_ROTATION,
  MOTOR_POSITION,
  MOTOR_SIZE,
  RAIL_HEIGHT,
  RAIL_THICKNESS,
  RAIL_Z,
} from '../../three/kinetic/conveyor'
import { CONVEYOR_ORIGIN } from '../../three/kinetic/layout'
import { createBeltTexture } from '../../three/kinetic/textures'
import type { Vec3 } from '../../three/kinetic/types'
import ConveyorBlocks from './ConveyorBlocks.vue'

/** Belt frame, rollers and glass gate. The skill blocks riding it live in `ConveyorBlocks`. */
const BELT_TEXTURE_REPEAT = 3
const ROLLER_RADIUS = 0.16
const LEG_TOP = -0.2
const LEG_HEIGHT = LEG_TOP - FLOOR_LOCAL_Y
const LEG_POSITIONS: Vec3[] = [
  [-2.6, LEG_TOP - LEG_HEIGHT / 2, 0.55],
  [-2.6, LEG_TOP - LEG_HEIGHT / 2, -0.55],
  [2.6, LEG_TOP - LEG_HEIGHT / 2, 0.55],
  [2.6, LEG_TOP - LEG_HEIGHT / 2, -0.55],
]
const ROLLER_X = [-BELT_LENGTH / 2, BELT_LENGTH / 2]
const FACE_FORWARD: Vec3 = [Math.PI / 2, 0, 0]

const { brushedSteel, darkSteel, plastic, clearGlass } = useKineticMaterials()
const { state } = useMechanism()

const beltTexture = createBeltTexture()
beltTexture.repeat.set(BELT_TEXTURE_REPEAT, 1)
const beltMaterial = new MeshStandardMaterial({ map: beltTexture, roughness: 0.85, metalness: 0 })

const rollerRefs = shallowRef<(Object3D | null)[]>([])
let travel = 0

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  const step = BELT_SPEED * state.speed * Math.min(delta, 0.1)
  travel += step
  beltTexture.offset.x -= (step / BELT_LENGTH) * BELT_TEXTURE_REPEAT
  rollerRefs.value.forEach((roller) => {
    if (roller) roller.rotation.y = -travel / ROLLER_RADIUS
  })
})

onUnmounted(() => {
  beltTexture.dispose()
  beltMaterial.dispose()
})
</script>

<template>
  <TresGroup :position="CONVEYOR_ORIGIN">
    <TresMesh :material="beltMaterial" :position="[0, -BELT_THICKNESS / 2, 0]" receive-shadow>
      <TresBoxGeometry :args="[BELT_LENGTH, BELT_THICKNESS, BELT_WIDTH]" />
    </TresMesh>

    <TresGroup v-for="(x, index) in ROLLER_X" :key="`roller-${index}`" :position="[x, -ROLLER_RADIUS, 0]" :rotation="FACE_FORWARD">
      <TresMesh :ref="(el) => (rollerRefs[index] = el as Object3D | null)" :material="brushedSteel" cast-shadow>
        <TresCylinderGeometry :args="[ROLLER_RADIUS, ROLLER_RADIUS, BELT_WIDTH + 0.1, 32]" />
      </TresMesh>
      <TresMesh v-for="side in [-1, 1]" :key="side" :material="darkSteel" :position="[0, side * (BELT_WIDTH / 2 + 0.12), 0]">
        <TresCylinderGeometry :args="[0.07, 0.07, 0.1, 6]" />
      </TresMesh>
    </TresGroup>

    <TresMesh
      v-for="side in [-1, 1]"
      :key="`rail-${side}`"
      :material="brushedSteel"
      :position="[0, RAIL_HEIGHT / 2 - 0.12, side * RAIL_Z]"
      cast-shadow
      receive-shadow
    >
      <TresBoxGeometry :args="[BELT_LENGTH + 0.5, RAIL_HEIGHT, RAIL_THICKNESS]" />
    </TresMesh>

    <TresMesh v-for="(leg, index) in LEG_POSITIONS" :key="`leg-${index}`" :material="darkSteel" :position="leg" cast-shadow>
      <TresBoxGeometry :args="[0.12, LEG_HEIGHT, 0.12]" />
    </TresMesh>

    <TresMesh :material="plastic.yellow" :position="MOTOR_POSITION" cast-shadow receive-shadow>
      <TresBoxGeometry :args="MOTOR_SIZE" />
    </TresMesh>

    <TresMesh :material="clearGlass" :rotation="GATE_ROTATION" pointerEvents="none">
      <TresTorusGeometry :args="GATE_ARGS" />
    </TresMesh>
  </TresGroup>

  <!-- Physics bodies write world transforms, so the blocks must sit outside the offset group. -->
  <Suspense>
    <ConveyorBlocks />
  </Suspense>
</template>
