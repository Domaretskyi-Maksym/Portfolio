<script setup lang="ts">
import { MeshTransmissionMaterial } from '@tresjs/cientos'
import { Physics, RigidBody } from '@tresjs/rapier'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { onUnmounted } from 'vue'
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import { createBoltRowGeometry } from '../../three/kinetic/gearGeometry'
import { GEAR_TRAIN } from '../../three/kinetic/gearTrain'
import { FLOOR_Y } from '../../three/kinetic/layout'
import { ensureRapier } from '../../three/kinetic/rapier'
import type { Vec3 } from '../../three/kinetic/types'
import BallFeeder from './BallFeeder.vue'
import GearPart from './GearPart.vue'
import HubPart from './HubPart.vue'
import KinematicPart from './KinematicPart.vue'
import PendulumPart from './PendulumPart.vue'

/**
 * The working machine. Everything here lives in world coordinates around the origin:
 * rapier writes world transforms straight into each body's group.
 */
const GRAVITY: Vec3 = [0, -9.81, 0]

const BASE_SIZE: Vec3 = [9.6, 0.3, 1.6]
const BASE_POSITION: Vec3 = [0.2, FLOOR_Y + BASE_SIZE[1] / 2, 0]
/** Ramps at the base edges so marbles roll off-screen instead of pooling in the middle. */
const BASE_HALF_X = BASE_SIZE[0] / 2
const RAMP_LENGTH = 1.35
const RAMP_THICK = 0.22
const RAMP_TILT_Z = 0.22
const RAMP_Y = FLOOR_Y + BASE_SIZE[1] + RAMP_THICK / 2 - 0.02
const LEFT_RAMP_X = BASE_POSITION[0] - BASE_HALF_X - RAMP_LENGTH / 2 + 0.08
const RIGHT_RAMP_X = BASE_POSITION[0] + BASE_HALF_X + RAMP_LENGTH / 2 - 0.08

const PLATE_SIZE: Vec3 = [9.2, 7.9, 0.12]
const PLATE_POSITION: Vec3 = [0.2, FLOOR_Y + BASE_SIZE[1] + PLATE_SIZE[1] / 2, -0.45]
const PLATE_EXPLODE: Vec3 = [0, 0, -1.6]

const PENDULUM_PIVOT: Vec3 = [4.2, 2.6, 0.45]
/** Pendulum bracket, relative to the plate body. */
const BRACKET_POSITION: Vec3 = [
  PENDULUM_PIVOT[0] - PLATE_POSITION[0],
  PENDULUM_PIVOT[1] - PLATE_POSITION[1],
  (PENDULUM_PIVOT[2] - PLATE_POSITION[2]) / 2,
]

const HUB_POSITION: Vec3 = [0, 0, 0.34]

const COVER_SIZE: Vec3 = [3.2, 3, 0.12]
const COVER_POSITION: Vec3 = [-3, -1.8, 0.55]
const COVER_EXPLODE: Vec3 = [-0.6, -0.4, 2.6]
/** Standoffs that hold the glass off the plate, relative to the cover body. */
const COVER_CLIPS: Vec3[] = [
  [-COVER_SIZE[0] / 2 + 0.18, COVER_SIZE[1] / 2 - 0.18, -0.02],
  [COVER_SIZE[0] / 2 - 0.18, COVER_SIZE[1] / 2 - 0.18, -0.02],
  [-COVER_SIZE[0] / 2 + 0.18, -COVER_SIZE[1] / 2 + 0.18, -0.02],
  [COVER_SIZE[0] / 2 - 0.18, -COVER_SIZE[1] / 2 + 0.18, -0.02],
]

const plateGeometry = new RoundedBoxGeometry(...PLATE_SIZE, 3, 0.05)
const baseGeometry = new RoundedBoxGeometry(...BASE_SIZE, 3, 0.06)
const coverGeometry = new RoundedBoxGeometry(...COVER_SIZE, 4, 0.05)

const plateBolts = (() => {
  const [w, h] = PLATE_SIZE
  const inset = 0.28
  const points: Array<[number, number]> = []
  for (let i = 0; i <= 8; i++) {
    const x = -w / 2 + inset + ((w - inset * 2) * i) / 8
    points.push([x, h / 2 - inset], [x, -h / 2 + inset])
  }
  for (let i = 1; i < 6; i++) {
    const y = -h / 2 + inset + ((h - inset * 2) * i) / 6
    points.push([-w / 2 + inset, y], [w / 2 - inset, y])
  }
  return createBoltRowGeometry(points, 0.06)
})()

const { brushedSteel, darkSteel, plastic } = useKineticMaterials()

onUnmounted(() => {
  plateGeometry.dispose()
  baseGeometry.dispose()
  coverGeometry.dispose()
  plateBolts.dispose()
})

await ensureRapier()
</script>

<template>
  <Physics :gravity="GRAVITY">
    <!-- Catch-all far below the scene — balls should leave via the side ramps first. -->
    <RigidBody type="fixed" :position="[0, FLOOR_Y - 4.5, 0]">
      <TresMesh :visible="false">
        <TresBoxGeometry :args="[40, 0.2, 8]" />
      </TresMesh>
    </RigidBody>

    <RigidBody type="fixed" :position="BASE_POSITION">
      <TresMesh :geometry="baseGeometry" :material="brushedSteel" cast-shadow receive-shadow />
    </RigidBody>

    <RigidBody type="fixed" :position="[LEFT_RAMP_X, RAMP_Y, 0]" :rotation="[0, 0, RAMP_TILT_Z]">
      <TresMesh :visible="false">
        <TresBoxGeometry :args="[RAMP_LENGTH, RAMP_THICK, BASE_SIZE[2] + 0.2]" />
      </TresMesh>
    </RigidBody>
    <RigidBody type="fixed" :position="[RIGHT_RAMP_X, RAMP_Y, 0]" :rotation="[0, 0, -RAMP_TILT_Z]">
      <TresMesh :visible="false">
        <TresBoxGeometry :args="[RAMP_LENGTH, RAMP_THICK, BASE_SIZE[2] + 0.2]" />
      </TresMesh>
    </RigidBody>

    <KinematicPart :position="PLATE_POSITION" :explode-offset="PLATE_EXPLODE">
      <TresMesh :geometry="plateGeometry" :material="plastic.graphite" receive-shadow cast-shadow />
      <TresGroup>
        <TresMesh
          :geometry="plateBolts"
          :material="darkSteel"
          :position="[0, 0, PLATE_SIZE[2] / 2]"
          pointerEvents="none"
          cast-shadow
        />
        <TresMesh :material="brushedSteel" :position="BRACKET_POSITION" cast-shadow>
          <TresBoxGeometry :args="[0.22, 0.22, PENDULUM_PIVOT[2] - PLATE_POSITION[2]]" />
        </TresMesh>
      </TresGroup>
    </KinematicPart>

    <GearPart v-for="gear in GEAR_TRAIN" :key="gear.id" :gear="gear" />
    <HubPart :position="HUB_POSITION" />
    <PendulumPart :pivot="PENDULUM_PIVOT" />

    <KinematicPart :position="COVER_POSITION" :explode-offset="COVER_EXPLODE">
      <TresMesh :geometry="coverGeometry" pointerEvents="none">
        <MeshTransmissionMaterial
          :resolution="512"
          :samples="8"
          :thickness="0.6"
          :roughness="0.06"
          :ior="1.5"
          :chromatic-aberration="0.09"
          :anisotropic-blur="0.25"
          :distortion="0.35"
          :distortion-scale="0.45"
          :temporal-distortion="0.06"
          :clearcoat="1"
          :clearcoat-roughness="0.05"
          color="#f2f6ff"
        />
      </TresMesh>
      <TresGroup>
        <TresMesh
          v-for="(clip, index) in COVER_CLIPS"
          :key="index"
          :material="darkSteel"
          :position="clip"
          :rotation="[Math.PI / 2, 0, 0]"
          pointerEvents="none"
          cast-shadow
        >
          <TresCylinderGeometry :args="[0.07, 0.07, COVER_SIZE[2] + 0.1, 6]" />
        </TresMesh>
      </TresGroup>
    </KinematicPart>

    <BallFeeder />
  </Physics>
</template>
