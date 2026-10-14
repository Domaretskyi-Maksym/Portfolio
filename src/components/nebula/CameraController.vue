<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MathUtils, Vector2, Vector3, type PerspectiveCamera } from 'three'
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { cameraPath, NEBULA_CENTER } from '../../three/nebula/cameraPath'
import { scrollState } from '../../three/nebula/state'
import { pointerState } from '../../three/pointer'

gsap.registerPlugin(ScrollTrigger)

const LOOK_AHEAD = 0.01
const SCROLL_SCRUB_SECONDS = 1.2
const PARALLAX = new Vector2(0.4, 0.25)

const cameraRef = shallowRef<PerspectiveCamera>()

let timeline: gsap.core.Timeline | null = null

onMounted(() => {
  scrollState.progress = 0
  timeline = gsap
    .timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: SCROLL_SCRUB_SECONDS,
      },
    })
    .to(scrollState, { progress: 1, ease: 'none' })
})

onBeforeUnmount(() => {
  timeline?.scrollTrigger?.kill()
  timeline?.kill()
  timeline = null
})

const position = new Vector3()
const ahead = new Vector3()
const tangent = new Vector3()
const lookTarget = new Vector3()
const parallax = new Vector2()

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
  const camera = cameraRef.value
  if (!camera) return

  const progress = MathUtils.clamp(scrollState.progress, 0, 1)
  cameraPath.getPointAt(progress, position)

  if (progress + LOOK_AHEAD <= 1) {
    cameraPath.getPointAt(progress + LOOK_AHEAD, ahead)
  } else {
    ahead.copy(position).add(cameraPath.getTangentAt(1, tangent))
  }

  // Facing straight down the path while orbiting would hide the nebula,
  // so the gaze only follows the course during the dive.
  const forwardWeight =
    MathUtils.smoothstep(progress, 0.5, 0.66) * (1 - MathUtils.smoothstep(progress, 0.92, 1))
  lookTarget.copy(NEBULA_CENTER).lerp(ahead, forwardWeight)

  const pointerX = pointerState.active ? pointerState.ndc.x : 0
  const pointerY = pointerState.active ? pointerState.ndc.y : 0
  parallax.x = MathUtils.damp(parallax.x, pointerX * PARALLAX.x, 3, delta)
  parallax.y = MathUtils.damp(parallax.y, pointerY * PARALLAX.y, 3, delta)

  camera.position.set(position.x + parallax.x, position.y + parallax.y, position.z)
  camera.lookAt(lookTarget)
})
</script>

<template>
  <TresPerspectiveCamera ref="cameraRef" :fov="55" :near="0.05" :far="200" :position="[0, 2, 22]" />
</template>
