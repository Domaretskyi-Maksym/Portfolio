<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { RigidBody } from '@tresjs/rapier'
import { shallowRef } from 'vue'
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import type { AccentName } from '../../three/kinetic/materials'
import type { Vec3 } from '../../three/kinetic/types'

interface DynamicBody {
  translation(): { x: number; y: number; z: number }
  linvel(): { x: number; y: number; z: number }
  setTranslation(translation: { x: number; y: number; z: number }, wakeUp: boolean): void
  setLinvel(velocity: { x: number; y: number; z: number }, wakeUp: boolean): void
  setAngvel(velocity: { x: number; y: number; z: number }, wakeUp: boolean): void
}

/** Dynamic balls dropped onto the gear train; they respawn only after rolling off-screen. */
const BALL_RADIUS = 0.18
const SPAWN_X = 1.95
const SPAWN_SPREAD_X = 0.5
const SPAWN_Y = 5.6
/** Respawn once a ball has cleared the frame on the left or right (after leaving the base). */
const EXIT_LEFT_X = -7.4
const EXIT_RIGHT_X = 7.8
/** Wedged in the gears with almost no motion — recycle after this long. */
const STUCK_SECONDS = 14
const STUCK_SPEED = 0.06
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
const stuckTime = balls.map(() => 0)

const ZERO = { x: 0, y: 0, z: 0 }

function respawn(body: DynamicBody, index: number) {
  ages[index] = 0
  stuckTime[index] = 0
  const jitter = (Math.random() - 0.5) * SPAWN_SPREAD_X
  body.setTranslation({ x: SPAWN_X + jitter, y: SPAWN_Y, z: 0 }, true)
  body.setLinvel(ZERO, true)
  body.setAngvel(ZERO, true)
}

function speed(body: DynamicBody) {
  const v = body.linvel()
  return Math.hypot(v.x, v.y)
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  bodyRefs.value.forEach((ref, index) => {
    const body = ref?.instance
    if (!body) return

    ages[index] += delta
    const { x, y } = body.translation()

    if (x <= EXIT_LEFT_X || x >= EXIT_RIGHT_X) {
      respawn(body, index)
      return
    }

    if (speed(body) < STUCK_SPEED) stuckTime[index] += delta
    else stuckTime[index] = 0

    if (stuckTime[index] >= STUCK_SECONDS || (ages[index] > 28 && y < -2.8)) {
      respawn(body, index)
    }
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
    :linear-damping="0.08"
    :restitution="0.35"
    :friction="0.55"
  >
    <TresMesh :material="plastic[ball.color]" cast-shadow receive-shadow>
      <TresSphereGeometry :args="[BALL_RADIUS, 24, 16]" />
    </TresMesh>
  </RigidBody>
</template>
