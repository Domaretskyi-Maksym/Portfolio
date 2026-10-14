<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { MathUtils, MeshStandardMaterial, type Object3D } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { onUnmounted, shallowRef } from 'vue'
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import { useMechanism } from '../../composables/useMechanism'
import { skills } from '../../data/skills'
import { CONVEYOR_ORIGIN, FLOOR_Y } from '../../three/kinetic/layout'
import { createBeltTexture, createSkillTexture } from '../../three/kinetic/textures'
import type { Vec3 } from '../../three/kinetic/types'

/** Skills ride a belt through a frosted-glass gate. Local origin = top surface of the belt. */
const BELT_LENGTH = 6
const BELT_WIDTH = 1.3
const BELT_THICKNESS = 0.08
const BELT_SPEED = 0.45
const BELT_TEXTURE_REPEAT = 3
const ROLLER_RADIUS = 0.16
const TILE_SIZE = 0.8
const TILE_DEPTH = 0.26
/** Distance over which tiles grow/shrink at the belt ends. */
const TILE_FADE = 0.45
const LEG_TOP = -0.2
const LEG_HEIGHT = LEG_TOP - (FLOOR_Y - CONVEYOR_ORIGIN[1])
const LEG_POSITIONS: Vec3[] = [
  [-2.6, LEG_TOP - LEG_HEIGHT / 2, 0.55],
  [-2.6, LEG_TOP - LEG_HEIGHT / 2, -0.55],
  [2.6, LEG_TOP - LEG_HEIGHT / 2, 0.55],
  [2.6, LEG_TOP - LEG_HEIGHT / 2, -0.55],
]
const ROLLER_X = [-BELT_LENGTH / 2, BELT_LENGTH / 2]
const FACE_FORWARD: Vec3 = [Math.PI / 2, 0, 0]
const GATE_ROTATION: Vec3 = [0, Math.PI / 2, 0]

const { brushedSteel, plastic, frostedGlass } = useKineticMaterials()
const { state } = useMechanism()

const beltTexture = createBeltTexture()
beltTexture.repeat.set(BELT_TEXTURE_REPEAT, 1)
const beltMaterial = new MeshStandardMaterial({ map: beltTexture, roughness: 0.85, metalness: 0 })

const tileGeometry = new RoundedBoxGeometry(TILE_SIZE, TILE_SIZE, TILE_DEPTH, 4, 0.08)
const tiles = skills.map((skill) => {
  const texture = createSkillTexture(skill.label, skill.finish === 'yellow' ? '#1b1c20' : '#f4f4f5')
  return {
    skill,
    body: skill.finish === 'steel' ? brushedSteel : plastic[skill.finish],
    label: new MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.6 }),
    texture,
  }
})

const tileRefs = shallowRef<(Object3D | null)[]>([])
const rollerRefs = shallowRef<(Object3D | null)[]>([])
const spacing = BELT_LENGTH / tiles.length
let travel = 0

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  const step = BELT_SPEED * state.speed * Math.min(delta, 0.1)
  travel += step
  beltTexture.offset.x -= (step / BELT_LENGTH) * BELT_TEXTURE_REPEAT

  rollerRefs.value.forEach((roller) => {
    if (roller) roller.rotation.y = -travel / ROLLER_RADIUS
  })

  tileRefs.value.forEach((tile, index) => {
    if (!tile) return
    const x = MathUtils.euclideanModulo(index * spacing + travel, BELT_LENGTH) - BELT_LENGTH / 2
    const edge = Math.min(x + BELT_LENGTH / 2, BELT_LENGTH / 2 - x)
    tile.position.x = x
    tile.scale.setScalar(Math.max(MathUtils.smoothstep(edge, 0, TILE_FADE), 0.001))
  })
})

onUnmounted(() => {
  beltTexture.dispose()
  beltMaterial.dispose()
  tileGeometry.dispose()
  tiles.forEach(({ label, texture }) => {
    label.dispose()
    texture.dispose()
  })
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
    </TresGroup>

    <TresMesh
      v-for="side in [-1, 1]"
      :key="`rail-${side}`"
      :material="brushedSteel"
      :position="[0, -0.02, side * (BELT_WIDTH / 2 + 0.06)]"
      cast-shadow
      receive-shadow
    >
      <TresBoxGeometry :args="[BELT_LENGTH + 0.5, 0.2, 0.06]" />
    </TresMesh>

    <TresMesh v-for="(leg, index) in LEG_POSITIONS" :key="`leg-${index}`" :material="brushedSteel" :position="leg" cast-shadow>
      <TresBoxGeometry :args="[0.12, LEG_HEIGHT, 0.12]" />
    </TresMesh>

    <TresMesh :material="plastic.yellow" :position="[-BELT_LENGTH / 2 - 0.55, -0.3, 0]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[0.7, 0.8, 1.1]" />
    </TresMesh>

    <TresMesh :material="frostedGlass" :rotation="GATE_ROTATION">
      <TresTorusGeometry :args="[0.98, 0.07, 16, 64, Math.PI]" />
    </TresMesh>

    <TresGroup
      v-for="(tile, index) in tiles"
      :key="tile.skill.id"
      :ref="(el) => (tileRefs[index] = el as Object3D | null)"
      :position="[0, TILE_SIZE / 2, 0]"
    >
      <TresMesh :geometry="tileGeometry" :material="tile.body" cast-shadow receive-shadow />
      <TresMesh :material="tile.label" :position="[0, 0, TILE_DEPTH / 2 + 0.002]">
        <TresPlaneGeometry :args="[TILE_SIZE * 0.9, TILE_SIZE * 0.9]" />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>
