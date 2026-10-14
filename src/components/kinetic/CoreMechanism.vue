<script setup lang="ts">
import { Physics, RigidBody } from '@tresjs/rapier'
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import { GEAR_TRAIN } from '../../three/kinetic/gearTrain'
import { FLOOR_Y } from '../../three/kinetic/layout'
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

const COVER_POSITION: Vec3 = [-3, -1.8, 0.5]
const COVER_EXPLODE: Vec3 = [-0.6, -0.4, 2.6]

const { brushedSteel, plastic, frostedGlass } = useKineticMaterials()
</script>

<template>
  <Physics :gravity="GRAVITY">
    <RigidBody type="fixed" :position="[0, FLOOR_Y - 0.1, 0]">
      <TresMesh :visible="false">
        <TresBoxGeometry :args="[60, 0.2, 60]" />
      </TresMesh>
    </RigidBody>

    <RigidBody type="fixed" :position="BASE_POSITION">
      <TresMesh :material="brushedSteel" cast-shadow receive-shadow>
        <TresBoxGeometry :args="BASE_SIZE" />
      </TresMesh>
    </RigidBody>

    <KinematicPart :position="PLATE_POSITION" :explode-offset="PLATE_EXPLODE">
      <TresMesh :material="plastic.graphite" receive-shadow cast-shadow>
        <TresBoxGeometry :args="PLATE_SIZE" />
      </TresMesh>
      <TresGroup>
        <TresMesh :material="brushedSteel" :position="BRACKET_POSITION" cast-shadow>
          <TresBoxGeometry :args="[0.22, 0.22, PENDULUM_PIVOT[2] - PLATE_POSITION[2]]" />
        </TresMesh>
      </TresGroup>
    </KinematicPart>

    <GearPart v-for="gear in GEAR_TRAIN" :key="gear.id" :gear="gear" />
    <HubPart :position="HUB_POSITION" />
    <PendulumPart :pivot="PENDULUM_PIVOT" />

    <KinematicPart :position="COVER_POSITION" :explode-offset="COVER_EXPLODE">
      <TresMesh :material="frostedGlass" pointerEvents="none">
        <TresBoxGeometry :args="[3.2, 3, 0.08]" />
      </TresMesh>
    </KinematicPart>

    <BallFeeder />
  </Physics>
</template>
