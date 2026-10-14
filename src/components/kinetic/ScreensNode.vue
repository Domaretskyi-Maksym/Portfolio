<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { Color, MathUtils, MeshBasicMaterial, Vector3, type Object3D } from 'three'
import { onUnmounted, shallowRef } from 'vue'
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import { projects } from '../../data/projects'
import { FLOOR_Y, SCREENS_ORIGIN } from '../../three/kinetic/layout'
import { createScreenFeed } from '../../three/kinetic/screenFeed'

/** Carousel of glass project screens. Hover brakes it; hold + drag to spin manually. */
const RADIUS = 2.2
const SCREEN_WIDTH = 2.3
const SCREEN_HEIGHT = 1.5
const SCREEN_Y = 0.3
const DISPLAY_WIDTH = SCREEN_WIDTH - 0.2
const DISPLAY_HEIGHT = SCREEN_HEIGHT - 0.19
const ROTOR_SPEED = 0.22
const ROTOR_RESPONSE = 3
const HOVER_LIFT = 0.12
/** Radians of carousel turn per horizontal screen pixel while dragging. */
const DRAG_SENSITIVITY = 0.0045
/** Display slightly above 1.0 so its brightest UI elements feed the bloom pass. */
const DISPLAY_GAIN = 1.35
const LED_GAIN = 7
/** Animated previews repaint a full canvas, so they only run near the camera and at a low rate. */
const FEED_FPS = 12
const FEED_ACTIVE_DISTANCE = 16
const FLOOR_LOCAL_Y = FLOOR_Y - SCREENS_ORIGIN[1]
const POLE_HEIGHT = SCREEN_Y - FLOOR_LOCAL_Y
const ORIGIN = new Vector3(...SCREENS_ORIGIN)

/** Tres forwards @pmndrs/pointer-events — not a DOM `PointerEvent`. */
interface TresPointerEvent {
  button?: number
  clientX?: number
  pointerId?: number
  object?: Object3D & { setPointerCapture?(id: number): void; releasePointerCapture?(id: number): void }
  nativeEvent?: Event
}

const { brushedSteel, darkSteel, plastic, clearGlass } = useKineticMaterials()

const screens = projects.map((project, index) => {
  const feed = createScreenFeed(project, DISPLAY_WIDTH / DISPLAY_HEIGHT)
  return {
    project,
    angle: (index / projects.length) * Math.PI * 2,
    feed,
    display: new MeshBasicMaterial({ map: feed.texture, color: new Color(DISPLAY_GAIN, DISPLAY_GAIN, DISPLAY_GAIN) }),
    led: new MeshBasicMaterial({ color: new Color(project.accent).multiplyScalar(LED_GAIN) }),
    lift: 0,
  }
})

const rotorRef = shallowRef<Object3D>()
const screenRefs = shallowRef<(Object3D | null)[]>([])
const hoverCounts = screens.map(() => 0)
let rotorVelocity = ROTOR_SPEED

let dragging = false
let lastPointerX = 0
let lastDragAt = 0
/** Spin rate (rad/s) at pointer release — carried into the rotor as inertia. */
let releaseSpin = 0
let captureTarget: TresPointerEvent['object'] | null = null
let capturePointerId = -1

const setHovered = (index: number, hovered: boolean) => {
  hoverCounts[index] = Math.max(0, hoverCounts[index] + (hovered ? 1 : -1))
}

function endDrag() {
  if (!dragging) return
  dragging = false
  captureTarget?.releasePointerCapture?.(capturePointerId)
  captureTarget = null
  capturePointerId = -1
  document.body.style.cursor = ''
  window.removeEventListener('pointermove', onPointerDrag)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
  rotorVelocity = MathUtils.clamp(releaseSpin, -1.1, 1.1)
}

function onPointerDrag(event: PointerEvent) {
  if (!dragging || !rotorRef.value) return
  const now = performance.now()
  const dx = event.clientX - lastPointerX
  lastPointerX = event.clientX
  const deltaAngle = dx * DRAG_SENSITIVITY
  rotorRef.value.rotation.y += deltaAngle
  const dt = Math.max((now - lastDragAt) / 1000, 1 / 240)
  lastDragAt = now
  releaseSpin = deltaAngle / dt
}

function onPointerDown(event: TresPointerEvent) {
  if ((event.button ?? 0) !== 0) return
  event.nativeEvent?.preventDefault?.()
  dragging = true
  releaseSpin = 0
  rotorVelocity = 0
  lastPointerX = event.clientX ?? (event.nativeEvent as PointerEvent | undefined)?.clientX ?? 0
  lastDragAt = performance.now()
  if (event.object && event.pointerId != null) {
    event.object.setPointerCapture?.(event.pointerId)
    captureTarget = event.object
    capturePointerId = event.pointerId
  }
  document.body.style.cursor = 'grabbing'
  window.addEventListener('pointermove', onPointerDrag)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
}

onUnmounted(() => {
  endDrag()
  screens.forEach(({ feed, display, led }) => {
    feed.dispose()
    display.dispose()
    led.dispose()
  })
})

let feedClock = 0

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta, elapsed, camera }) => {
  const dt = Math.min(delta, 0.1)
  const anyHovered = hoverCounts.some((count) => count > 0)

  if (!dragging && rotorRef.value) {
    const targetSpeed = anyHovered ? 0 : ROTOR_SPEED
    rotorVelocity = MathUtils.damp(rotorVelocity, targetSpeed, ROTOR_RESPONSE, delta)
    rotorRef.value.rotation.y += rotorVelocity * dt
  }

  screens.forEach((screen, index) => {
    screen.lift = MathUtils.damp(screen.lift, hoverCounts[index] > 0 || dragging ? HOVER_LIFT : 0, 8, delta)
    const node = screenRefs.value[index]
    if (node) node.position.y = SCREEN_Y + screen.lift
  })

  feedClock += delta
  const isNear = camera.value ? camera.value.position.distanceTo(ORIGIN) < FEED_ACTIVE_DISTANCE : false
  if (isNear && feedClock >= 1 / FEED_FPS) {
    feedClock = 0
    screens.forEach(({ feed }) => feed.update(elapsed))
  }
})
</script>

<template>
  <TresGroup :position="SCREENS_ORIGIN">
    <TresMesh :material="brushedSteel" :position="[0, FLOOR_LOCAL_Y + 0.1, 0]" cast-shadow receive-shadow>
      <TresCylinderGeometry :args="[1.2, 1.3, 0.2, 64]" />
    </TresMesh>
    <TresMesh :material="darkSteel" :position="[0, FLOOR_LOCAL_Y + 0.22, 0]" cast-shadow receive-shadow>
      <TresCylinderGeometry :args="[0.42, 0.5, 0.08, 6]" />
    </TresMesh>
    <TresMesh :material="brushedSteel" :position="[0, FLOOR_LOCAL_Y + POLE_HEIGHT / 2, 0]" cast-shadow>
      <TresCylinderGeometry :args="[0.08, 0.08, POLE_HEIGHT, 16]" />
    </TresMesh>

    <TresGroup ref="rotorRef">
      <TresMesh :material="plastic.red" :position="[0, SCREEN_Y, 0]" cast-shadow>
        <TresCylinderGeometry :args="[0.3, 0.3, 0.3, 32]" />
      </TresMesh>

      <TresGroup v-for="(screen, index) in screens" :key="screen.project.id" :rotation="[0, screen.angle, 0]">
        <TresMesh :material="brushedSteel" :position="[0, SCREEN_Y, RADIUS / 2]" cast-shadow>
          <TresBoxGeometry :args="[0.06, 0.06, RADIUS]" />
        </TresMesh>

        <TresGroup :ref="(el) => (screenRefs[index] = el as Object3D | null)" :position="[0, SCREEN_Y, RADIUS]">
          <TresMesh
            :material="clearGlass"
            cast-shadow
            @pointerover="setHovered(index, true)"
            @pointerout="setHovered(index, false)"
            @pointerdown="onPointerDown"
          >
            <TresBoxGeometry :args="[SCREEN_WIDTH, SCREEN_HEIGHT, 0.08]" />
          </TresMesh>
          <TresMesh
            :material="screen.display"
            :position="[0, 0, 0.05]"
            @pointerover="setHovered(index, true)"
            @pointerout="setHovered(index, false)"
            @pointerdown="onPointerDown"
          >
            <TresPlaneGeometry :args="[DISPLAY_WIDTH, DISPLAY_HEIGHT]" />
          </TresMesh>

          <!-- Neon LED strip under the display; its light spills onto the stand below. -->
          <TresMesh :material="screen.led" :position="[0, -SCREEN_HEIGHT / 2 + 0.035, 0.06]" pointerEvents="none">
            <TresBoxGeometry :args="[SCREEN_WIDTH - 0.3, 0.025, 0.02]" />
          </TresMesh>
          <TresPointLight
            :color="screen.project.accent"
            :intensity="4"
            :distance="3.2"
            :decay="2"
            :position="[0, -SCREEN_HEIGHT / 2 - 0.15, 0.45]"
          />
        </TresGroup>
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>
