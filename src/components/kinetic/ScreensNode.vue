<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { MathUtils, MeshBasicMaterial, type Object3D } from 'three'
import { onUnmounted, shallowRef } from 'vue'
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import { projects } from '../../data/projects'
import { FLOOR_Y, SCREENS_ORIGIN } from '../../three/kinetic/layout'
import { createScreenTexture } from '../../three/kinetic/textures'

/** Carousel of frosted-glass project screens. Hovering a screen brakes the rotor. */
const RADIUS = 2.2
const SCREEN_WIDTH = 2.3
const SCREEN_HEIGHT = 1.5
const SCREEN_Y = 0.3
const ROTOR_SPEED = 0.22
const ROTOR_RESPONSE = 3
const HOVER_LIFT = 0.12
const FLOOR_LOCAL_Y = FLOOR_Y - SCREENS_ORIGIN[1]
const POLE_HEIGHT = SCREEN_Y - FLOOR_LOCAL_Y

const { brushedSteel, plastic, frostedGlass } = useKineticMaterials()

const screens = projects.map((project, index) => {
  const texture = createScreenTexture(project.title, project.tag, project.description, project.accent)
  return {
    project,
    angle: (index / projects.length) * Math.PI * 2,
    texture,
    display: new MeshBasicMaterial({ map: texture }),
    lift: 0,
  }
})

const rotorRef = shallowRef<Object3D>()
const screenRefs = shallowRef<(Object3D | null)[]>([])
/** Per-screen count of hovered meshes (glass + display), so moving between them never flickers. */
const hoverCounts = screens.map(() => 0)
let rotorVelocity = ROTOR_SPEED

const setHovered = (index: number, hovered: boolean) => {
  hoverCounts[index] = Math.max(0, hoverCounts[index] + (hovered ? 1 : -1))
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  const anyHovered = hoverCounts.some((count) => count > 0)
  rotorVelocity = MathUtils.damp(rotorVelocity, anyHovered ? 0 : ROTOR_SPEED, ROTOR_RESPONSE, delta)
  if (rotorRef.value) rotorRef.value.rotation.y += rotorVelocity * Math.min(delta, 0.1)

  screens.forEach((screen, index) => {
    screen.lift = MathUtils.damp(screen.lift, hoverCounts[index] > 0 ? HOVER_LIFT : 0, 8, delta)
    const node = screenRefs.value[index]
    if (node) node.position.y = SCREEN_Y + screen.lift
  })
})

onUnmounted(() => {
  screens.forEach(({ texture, display }) => {
    texture.dispose()
    display.dispose()
  })
})
</script>

<template>
  <TresGroup :position="SCREENS_ORIGIN">
    <TresMesh :material="brushedSteel" :position="[0, FLOOR_LOCAL_Y + 0.1, 0]" cast-shadow receive-shadow>
      <TresCylinderGeometry :args="[1.2, 1.3, 0.2, 64]" />
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
            :material="frostedGlass"
            cast-shadow
            @pointerover="setHovered(index, true)"
            @pointerout="setHovered(index, false)"
          >
            <TresBoxGeometry :args="[SCREEN_WIDTH, SCREEN_HEIGHT, 0.08]" />
          </TresMesh>
          <TresMesh
            :material="screen.display"
            :position="[0, 0, 0.05]"
            @pointerover="setHovered(index, true)"
            @pointerout="setHovered(index, false)"
          >
            <TresPlaneGeometry :args="[SCREEN_WIDTH - 0.2, SCREEN_HEIGHT - 0.19]" />
          </TresMesh>
        </TresGroup>
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>
