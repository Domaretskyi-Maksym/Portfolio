<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { RigidBody, type RigidBodyCollidersShape } from '@tresjs/rapier'
import { Quaternion, Vector3 } from 'three'
import { shallowRef } from 'vue'
import { useMechanism } from '../../composables/useMechanism'
import { motionAngle, type PartMotion, type Vec3 } from '../../three/kinetic/types'

interface KinematicBody {
  setNextKinematicTranslation(translation: { x: number; y: number; z: number }): void
  setNextKinematicRotation(rotation: { x: number; y: number; z: number; w: number }): void
}

/**
 * Kinematic rapier body driven by the mechanism: spins/swings around world Z with the master
 * angle and slides along `explodeOffset` as the machine explodes. Direct mesh children become
 * colliders; wrap decorative meshes in a group to keep them out of the physics world.
 */
const props = withDefaults(
  defineProps<{
    position: Vec3
    explodeOffset?: Vec3
    motion?: PartMotion
    collider?: RigidBodyCollidersShape
    solid?: boolean
  }>(),
  { explodeOffset: () => [0, 0, 0], motion: undefined, collider: undefined, solid: true },
)

const { state } = useMechanism()
const bodyRef = shallowRef<{ instance?: KinematicBody }>()

const AXIS_Z = new Vector3(0, 0, 1)
const translation = new Vector3()
const rotation = new Quaternion()

const { onBeforeRender } = useLoop()
onBeforeRender(() => {
  const body = bodyRef.value?.instance
  if (!body) return

  const [ox, oy, oz] = props.explodeOffset
  const [px, py, pz] = props.position
  translation.set(px + ox * state.explode, py + oy * state.explode, pz + oz * state.explode)
  body.setNextKinematicTranslation(translation)

  if (props.motion) {
    rotation.setFromAxisAngle(AXIS_Z, motionAngle(props.motion, state.angle))
    body.setNextKinematicRotation(rotation)
  }
})
</script>

<template>
  <RigidBody ref="bodyRef" type="kinematic" :position="position" :collider="solid ? collider : false">
    <slot />
  </RigidBody>
</template>
