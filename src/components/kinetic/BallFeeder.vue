<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { RigidBody } from '@tresjs/rapier'
import { shallowRef } from 'vue'
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import { FLOOR_Y } from '../../three/kinetic/layout'
import type { AccentName } from '../../three/kinetic/materials'
import type { Vec3 } from '../../three/kinetic/types'

interface DynamicBody {
  translation(): { x: number; y: number; z: number }
  setTranslation(translation: { x: number; y: number; z: number }, wakeUp: boolean): void
  setLinvel(velocity: { x: number; y: number; z: number }, wakeUp: boolean): void
  setAngvel(velocity: { x: number; y: number; z: number }, wakeUp: boolean): void
}

/** Dynamic balls dropped onto the gear train; they respawn once they land or get wedged. */
const BALL_RADIUS = 0.18
const SPAWN_X = 1.95
const SPAWN_SPREAD_X = 0.5
const SPAWN_Y = 5.6
const RESPAWN_BELOW_Y = FLOOR_Y + 1
const MAX_LIFETIME_SECONDS = 9
/** Balls move in the gear plane only, like marbles in a glass-fronted machine. */
const PLANAR: [boolean, boolean, boolean] = [true, true, false]
const COLORS: AccentName[] = ['red', 'yellow', 'blue', 'red', 'yellow', 'blue']

const balls = COLORS.map((color, index) => ({
  color,
  spawn: [SPAWN_X + (index % 3 - 1) * (SPAWN_SPREAD_X / 2), SPAWN_Y + index * 1.1, 0] as Vec3,
}))

const { plastic } = useKineticMaterials()
const bodyRefs = shallowRef<({ instance?: DynamicBody } | null)[]>([])
const ages = balls.map(() => 0)

const ZERO = { x: 0, y: 0, z: 0 }

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  bodyRefs.value.forEach((ref, index) => {
    const body = ref?.instance
    if (!body) return
    ages[index] += delta
    if (body.translation().y > RESPAWN_BELOW_Y && ages[index] < MAX_LIFETIME_SECONDS) return

    ages[index] = 0
    const jitter = (Math.random() - 0.5) * SPAWN_SPREAD_X
    body.setTranslation({ x: SPAWN_X + jitter, y: SPAWN_Y, z: 0 }, true)
    body.setLinvel(ZERO, true)
    body.setAngvel(ZERO, true)
  })
})
</script>

<template>
  <RigidBody
    v-for="(ball, index) in balls"
    :key="index"
    :ref="(el) => (bodyRefs[index] = el as { instance?: DynamicBody } | null)"
    type="dynamic"
    collider="ball"
    :position="ball.spawn"
    :enabled-translations="PLANAR"
    :linear-damping="0.1"
    :restitution="0.35"
    :friction="0.6"
  >
    <TresMesh :material="plastic[ball.color]" cast-shadow receive-shadow>
      <TresSphereGeometry :args="[BALL_RADIUS, 24, 16]" />
    </TresMesh>
  </RigidBody>
</template>
