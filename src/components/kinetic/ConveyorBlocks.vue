<script setup lang="ts">
import { CoefficientCombineRule, type RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat'
import { useLoop } from '@tresjs/core'
import { Physics, RigidBody } from '@tresjs/rapier'
import { MathUtils, Plane, Raycaster, Vector3, type Object3D } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { onUnmounted, ref, shallowRef } from 'vue'
import { useMechanism } from '../../composables/useMechanism'
import { skills, type Skill } from '../../data/skills'
import {
  BELT_LENGTH,
  BELT_SPEED,
  BELT_THICKNESS,
  BELT_WIDTH,
  BLOCK_SIZE,
  GATE_ARGS,
  GATE_ROTATION,
  MOTOR_POSITION,
  MOTOR_SIZE,
  RAIL_HEIGHT,
  RAIL_THICKNESS,
  RAIL_Z,
} from '../../three/kinetic/conveyor'
import { CONVEYOR_ORIGIN, FLOOR_Y } from '../../three/kinetic/layout'
import { createEngravedMetal } from '../../three/kinetic/materials'
import { ensureRapier } from '../../three/kinetic/rapier'
import { createEngravingTextures } from '../../three/kinetic/textures'
import type { Vec3 } from '../../three/kinetic/types'
import { pointerState } from '../../three/pointer'

interface BlockBody {
  translation(): { x: number; y: number; z: number }
  linvel(): { x: number; y: number; z: number }
  angvel(): { x: number; y: number; z: number }
  isDynamic(): boolean
  isKinematic(): boolean
  setTranslation(t: { x: number; y: number; z: number }, wakeUp: boolean): void
  setRotation(q: { x: number; y: number; z: number; w: number }, wakeUp: boolean): void
  setLinvel(v: { x: number; y: number; z: number }, wakeUp: boolean): void
  setAngvel(v: { x: number; y: number; z: number }, wakeUp: boolean): void
  setNextKinematicTranslation(t: { x: number; y: number; z: number }): void
}

type BlockPhase = 'active' | 'despawning' | 'spawning'

/**
 * Skill blocks as dynamic bodies on their own physics world: the belt drags them along,
 * the user can grab, toss or knock them off, and fallen blocks are recycled at the belt start.
 * World coordinates throughout — rapier writes world transforms straight into each body group.
 */
const [OX, OY, OZ] = CONVEYOR_ORIGIN
const GRAVITY: Vec3 = [0, -9.81, 0]
const HALF = BLOCK_SIZE / 2
const SPAWN_X = OX - BELT_LENGTH / 2 + 0.55
const SPAWN_Y = OY + HALF + 0.02
const SPAWN_CLEARANCE = BLOCK_SIZE * 1.25
/** Blocks below this height have left the belt. */
const OFF_BELT_Y = OY - 0.35
const OFF_BELT_GRACE_SECONDS = 1.8
const MAX_DISTANCE = 14
const BELT_GRIP = 8
/** How quickly a block riding the belt stops tumbling/spinning. */
const BELT_SETTLE = 4
const SCALE_SECONDS = 0.35
const GRAB_FOLLOW = 18
const MIN_GRAB_Y = OY + HALF + 0.15
const MAX_THROW_SPEED = 9

const FINISH: Record<Skill['finish'], { color: string; glow: string }> = {
  red: { color: '#b4232f', glow: '#ffb3a1' },
  yellow: { color: '#c9971c', glow: '#fff1c4' },
  blue: { color: '#2347c9', glow: '#a9d1ff' },
  graphite: { color: '#34373e', glow: '#9fe7ff' },
  steel: { color: '#c3c7cd', glow: '#e9f6ff' },
}

const blockGeometry = new RoundedBoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 4, 0.07)

const blocks = skills.map((skill, index) => {
  const { bump, glow } = createEngravingTextures(skill.label)
  const finish = FINISH[skill.finish]
  return {
    skill,
    bump,
    glow,
    material: createEngravedMetal(finish.color, bump, glow, finish.glow),
    start: [SPAWN_X + index * (BELT_LENGTH / skills.length), SPAWN_Y, OZ] as Vec3,
  }
})

const { state } = useMechanism()

/** Reactive so the RigidBody switches between thrown (dynamic) and held (kinematic). */
const bodyTypes = ref<('dynamic' | 'kinematic')[]>(blocks.map(() => 'dynamic'))
const bodyRefs = shallowRef<({ instance?: BlockBody } | null)[]>([])
/**
 * The belt drives blocks by velocity, so its surface must be frictionless: a static collider's
 * friction would otherwise brake every block to a halt. `Min` makes the belt's zero win
 * over the blocks' own friction, which they still need against the floor and each other.
 */
const beltRef = shallowRef<{ instance?: RapierRigidBody }>()
let beltConfigured = false

function configureBelt() {
  const belt = beltRef.value?.instance
  if (!belt || belt.numColliders() === 0) return
  for (let i = 0; i < belt.numColliders(); i++) {
    belt.collider(i).setFrictionCombineRule(CoefficientCombineRule.Min)
  }
  beltConfigured = true
}
const meshRefs = shallowRef<(Object3D | null)[]>([])

const runtime = blocks.map(() => ({
  phase: 'spawning' as BlockPhase,
  phaseTime: 0,
  offBeltTime: 0,
  throwVelocity: null as Vector3 | null,
}))

const raycaster = new Raycaster()
const grabPlane = new Plane(new Vector3(0, 0, 1), 0)
const grabHit = new Vector3()
const grabOffset = new Vector3()
const grabTarget = new Vector3()
const grabCurrent = new Vector3()
const grabVelocity = new Vector3()
let grabbedIndex = -1

const ZERO = { x: 0, y: 0, z: 0 }
const IDENTITY = { x: 0, y: 0, z: 0, w: 1 }

function isOnBelt({ x, y, z }: { x: number; y: number; z: number }) {
  return Math.abs(x - OX) < BELT_LENGTH / 2 && Math.abs(z - OZ) < BELT_WIDTH / 2 && y > OY && y < OY + HALF + 0.12
}

function spawnZoneClear(except: number) {
  return bodyRefs.value.every((ref, index) => {
    if (index === except) return true
    const body = ref?.instance
    if (!body) return true
    const { x, y } = body.translation()
    return Math.abs(x - SPAWN_X) > SPAWN_CLEARANCE || y > OY + BLOCK_SIZE * 2
  })
}

function respawn(body: BlockBody, index: number) {
  body.setTranslation({ x: SPAWN_X, y: SPAWN_Y, z: OZ }, true)
  body.setRotation(IDENTITY, true)
  body.setLinvel(ZERO, true)
  body.setAngvel(ZERO, true)
  runtime[index].phase = 'spawning'
  runtime[index].phaseTime = 0
  runtime[index].offBeltTime = 0
}

function onBlockOver() {
  if (grabbedIndex === -1) document.body.style.cursor = 'grab'
}

function onBlockOut() {
  if (grabbedIndex === -1) document.body.style.cursor = ''
}

function onBlockDown(index: number, event: { point?: Vector3; button?: number }) {
  const body = bodyRefs.value[index]?.instance
  if (!body || (event.button ?? 0) !== 0 || runtime[index].phase !== 'active') return

  const position = body.translation()
  grabbedIndex = index
  grabPlane.constant = -position.z
  grabCurrent.set(position.x, position.y, position.z)
  grabOffset.copy(grabCurrent).sub(event.point ?? grabCurrent)
  grabOffset.z = 0
  grabVelocity.set(0, 0, 0)
  bodyTypes.value[index] = 'kinematic'
  document.body.style.cursor = 'grabbing'
  window.addEventListener('pointerup', releaseBlock)
  window.addEventListener('pointercancel', releaseBlock)
}

function releaseBlock() {
  if (grabbedIndex === -1) return
  const index = grabbedIndex
  grabbedIndex = -1
  runtime[index].throwVelocity = grabVelocity.clone().clampLength(0, MAX_THROW_SPEED)
  bodyTypes.value[index] = 'dynamic'
  document.body.style.cursor = ''
  window.removeEventListener('pointerup', releaseBlock)
  window.removeEventListener('pointercancel', releaseBlock)
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta, camera }) => {
  const dt = Math.min(delta, 0.1)
  const beltVelocity = BELT_SPEED * state.speed
  if (!beltConfigured) configureBelt()

  bodyRefs.value.forEach((ref, index) => {
    const body = ref?.instance
    if (!body) return
    const block = runtime[index]
    const mesh = meshRefs.value[index]
    block.phaseTime += dt

    if (block.phase === 'spawning') {
      const t = MathUtils.smootherstep(block.phaseTime / SCALE_SECONDS, 0, 1)
      mesh?.scale.setScalar(Math.max(t, 0.001))
      if (t >= 1) block.phase = 'active'
    } else if (block.phase === 'despawning') {
      const t = 1 - MathUtils.smootherstep(block.phaseTime / SCALE_SECONDS, 0, 1)
      mesh?.scale.setScalar(Math.max(t, 0.001))
      if (t <= 0 && spawnZoneClear(index)) respawn(body, index)
      return
    }

    if (index === grabbedIndex) {
      if (!body.isKinematic() || !camera.value) return
      raycaster.setFromCamera(pointerState.ndc, camera.value)
      if (!raycaster.ray.intersectPlane(grabPlane, grabHit)) return
      grabTarget.copy(grabHit).add(grabOffset)
      grabTarget.y = Math.max(grabTarget.y, MIN_GRAB_Y)
      const previousX = grabCurrent.x
      const previousY = grabCurrent.y
      grabCurrent.lerp(grabTarget, 1 - Math.exp(-GRAB_FOLLOW * dt))
      grabVelocity.set((grabCurrent.x - previousX) / dt, (grabCurrent.y - previousY) / dt, 0)
      body.setNextKinematicTranslation(grabCurrent)
      return
    }

    if (block.throwVelocity && body.isDynamic()) {
      const v = block.throwVelocity
      body.setLinvel({ x: v.x, y: v.y, z: v.z }, true)
      body.setAngvel({ x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6, z: -v.x * 1.5 }, true)
      block.throwVelocity = null
      return
    }

    const position = body.translation()
    if (isOnBelt(position)) {
      const v = body.linvel()
      body.setLinvel(
        { x: MathUtils.damp(v.x, beltVelocity, BELT_GRIP, dt), y: v.y, z: MathUtils.damp(v.z, 0, BELT_GRIP, dt) },
        true,
      )
      const w = body.angvel()
      const settle = Math.exp(-BELT_SETTLE * dt)
      body.setAngvel({ x: w.x * settle, y: w.y * settle, z: w.z * settle }, true)
    }

    const fellOff = position.y < OFF_BELT_Y
    const strayed = Math.hypot(position.x - OX, position.z - OZ) > MAX_DISTANCE || position.y < FLOOR_Y - 1
    block.offBeltTime = fellOff ? block.offBeltTime + dt : 0
    if (block.offBeltTime > OFF_BELT_GRACE_SECONDS || strayed) {
      block.phase = 'despawning'
      block.phaseTime = 0
    }
  })
})

onUnmounted(() => {
  releaseBlock()
  blockGeometry.dispose()
  blocks.forEach(({ material, bump, glow }) => {
    material.dispose()
    bump.dispose()
    glow.dispose()
  })
})

await ensureRapier()
</script>

<template>
  <Physics :gravity="GRAVITY">
    <RigidBody ref="beltRef" type="fixed" :position="[OX, OY - BELT_THICKNESS / 2, OZ]" :friction="0">
      <TresMesh :visible="false">
        <TresBoxGeometry :args="[BELT_LENGTH, BELT_THICKNESS, BELT_WIDTH]" />
      </TresMesh>
    </RigidBody>
    <RigidBody type="fixed" collider="trimesh" :position="CONVEYOR_ORIGIN" :restitution="0.3">
      <TresMesh :visible="false" :rotation="GATE_ROTATION">
        <TresTorusGeometry :args="GATE_ARGS" />
      </TresMesh>
    </RigidBody>
    <RigidBody
      v-for="side in [-1, 1]"
      :key="`rail-${side}`"
      type="fixed"
      :position="[OX, OY + RAIL_HEIGHT / 2 - 0.12, OZ + side * RAIL_Z]"
    >
      <TresMesh :visible="false">
        <TresBoxGeometry :args="[BELT_LENGTH + 0.5, RAIL_HEIGHT, RAIL_THICKNESS]" />
      </TresMesh>
    </RigidBody>
    <RigidBody type="fixed" :position="[OX + MOTOR_POSITION[0], OY + MOTOR_POSITION[1], OZ + MOTOR_POSITION[2]]">
      <TresMesh :visible="false">
        <TresBoxGeometry :args="MOTOR_SIZE" />
      </TresMesh>
    </RigidBody>
    <RigidBody type="fixed" :position="[OX, FLOOR_Y - 0.1, OZ]" :friction="0.8">
      <TresMesh :visible="false">
        <TresBoxGeometry :args="[MAX_DISTANCE * 2, 0.2, MAX_DISTANCE * 2]" />
      </TresMesh>
    </RigidBody>

    <RigidBody
      v-for="(block, index) in blocks"
      :key="block.skill.id"
      :ref="(el) => (bodyRefs[index] = el as { instance?: BlockBody } | null)"
      :type="bodyTypes[index]"
      collider="cuboid"
      :position="block.start"
      :friction="0.7"
      :restitution="0.25"
      :linear-damping="0.15"
      :angular-damping="0.4"
      enable-ccd
    >
      <TresMesh
        :ref="(el) => (meshRefs[index] = el as Object3D | null)"
        :geometry="blockGeometry"
        :material="block.material"
        cast-shadow
        receive-shadow
        @pointerover="onBlockOver"
        @pointerout="onBlockOut"
        @pointerdown="(event: { point?: Vector3; button?: number }) => onBlockDown(index, event)"
      />
    </RigidBody>
  </Physics>
</template>
