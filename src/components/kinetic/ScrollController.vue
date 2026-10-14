<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MathUtils, Vector2, Vector3, type PerspectiveCamera } from 'three'
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { useMechanism } from '../../composables/useMechanism'
import { CAMERA_NODES, cameraFocus, type CameraNode } from '../../three/kinetic/layout'
import { pointerState } from '../../three/pointer'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll drives a proxy through the camera nodes; the camera eases after it every frame.
 * Orbit/CameraControls are deliberately not used: they capture the wheel and fight page scroll.
 */
const CAMERA_RESPONSE = 4
const PARALLAX = new Vector2(0.35, 0.2)
/** Handheld drift (radians) at idle, plus extra vibration per unit of mechanism over-speed. */
const SHAKE_IDLE = 0.0016
const SHAKE_PER_SPEED = 0.0011

const { state: mechanism } = useMechanism()

/** Layered incommensurate sines — smooth, non-repeating, cheaper than noise. */
function drift(time: number, seed: number) {
  return (
    Math.sin(time * 0.63 + seed) * 0.55 +
    Math.sin(time * 1.37 + seed * 2.1) * 0.3 +
    Math.sin(time * 3.11 + seed * 4.7) * 0.15
  )
}

const toProxy = ({ position, target }: CameraNode) => ({
  px: position[0],
  py: position[1],
  pz: position[2],
  tx: target[0],
  ty: target[1],
  tz: target[2],
})

const rig = toProxy(CAMERA_NODES[0])
const cameraRef = shallowRef<PerspectiveCamera>()
let timeline: gsap.core.Timeline | null = null

onMounted(() => {
  timeline = gsap.timeline({
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  })
  for (const node of CAMERA_NODES.slice(1)) {
    timeline.to(rig, { ...toProxy(node), ease: 'power2.inOut' })
  }
})

onBeforeUnmount(() => {
  timeline?.scrollTrigger?.kill()
  timeline?.kill()
  timeline = null
})

const desiredPosition = new Vector3()
const desiredTarget = new Vector3()
const parallax = new Vector2()
let isPlaced = false

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta, elapsed }) => {
  const camera = cameraRef.value
  if (!camera) return

  const pointerX = pointerState.active ? pointerState.ndc.x : 0
  const pointerY = pointerState.active ? pointerState.ndc.y : 0
  parallax.x = MathUtils.damp(parallax.x, pointerX * PARALLAX.x, 3, delta)
  parallax.y = MathUtils.damp(parallax.y, pointerY * PARALLAX.y, 3, delta)

  desiredPosition.set(rig.px + parallax.x, rig.py + parallax.y, rig.pz)
  desiredTarget.set(rig.tx, rig.ty, rig.tz)

  if (isPlaced) {
    const t = 1 - Math.exp(-CAMERA_RESPONSE * delta)
    camera.position.lerp(desiredPosition, t)
    cameraFocus.lerp(desiredTarget, t)
  } else {
    camera.position.copy(desiredPosition)
    cameraFocus.copy(desiredTarget)
    isPlaced = true
  }
  camera.lookAt(cameraFocus)

  const shake = SHAKE_IDLE + Math.max(mechanism.speed - 1, 0) * SHAKE_PER_SPEED
  // Faster machine → higher-frequency rumble on top of the slow handheld drift.
  const rumble = elapsed * (1 + (mechanism.speed - 1) * 0.6)
  camera.rotateY(drift(elapsed, 1.3) * shake + drift(rumble * 9, 7.1) * shake * 0.25)
  camera.rotateX(drift(elapsed, 4.2) * shake * 0.8 + drift(rumble * 11, 2.9) * shake * 0.25)
  camera.rotateZ(drift(elapsed, 8.6) * shake * 0.5)
})
</script>

<template>
  <TresPerspectiveCamera ref="cameraRef" :fov="50" :near="0.1" :far="80" :position="CAMERA_NODES[0].position" />
</template>
