<script setup lang="ts">
import { Html } from '@tresjs/cientos'
import { useLoop } from '@tresjs/core'
import { BoxGeometry, Color, MathUtils, MeshPhysicalMaterial, Vector3, type Mesh } from 'three'
import { onBeforeUnmount, ref, shallowRef } from 'vue'
import type { Project } from '../../data/projects'

const props = defineProps<{
  project: Project
  position: [number, number, number]
  rotation: [number, number, number]
}>()

const PANEL_WIDTH = 1.8
const PANEL_HEIGHT = 1.1
const HOVER_SCALE = 1.12
const IDLE_GLOW = 0.04
const HOVER_GLOW = 0.3
const EASE_LAMBDA = 8
/** Panels emerge from the dust only when the camera flies close. */
const REVEAL_DISTANCE = 7
const HIDDEN_SCALE = 0.001
/** `Html transform` renders 400 / distanceFactor CSS px per world unit → 160px per unit here. */
const HTML_DISTANCE_FACTOR = 2.5

const panelRef = shallowRef<Mesh>()
const hovered = ref(false)
const revealed = ref(false)
const panelWorldPosition = new Vector3()

const geometry = new BoxGeometry(PANEL_WIDTH, PANEL_HEIGHT, 0.06)
const material = new MeshPhysicalMaterial({
  color: '#ffffff',
  transmission: 1,
  roughness: 0.2,
  thickness: 0.5,
  ior: 1.35,
  emissive: new Color(props.project.accent),
  emissiveIntensity: IDLE_GLOW,
})

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta, camera }) => {
  const panel = panelRef.value
  const activeCamera = camera.value
  if (!panel || !activeCamera) return

  panel.getWorldPosition(panelWorldPosition)
  const isNear = activeCamera.position.distanceTo(panelWorldPosition) < REVEAL_DISTANCE
  if (isNear !== revealed.value) revealed.value = isNear
  if (!isNear && hovered.value) onPointerOut()

  const targetScale = !isNear ? HIDDEN_SCALE : hovered.value ? HOVER_SCALE : 1
  panel.scale.setScalar(MathUtils.damp(panel.scale.x, targetScale, EASE_LAMBDA, delta))
  material.emissiveIntensity = MathUtils.damp(
    material.emissiveIntensity,
    hovered.value ? HOVER_GLOW : IDLE_GLOW,
    EASE_LAMBDA,
    delta,
  )
})

function onPointerOver() {
  hovered.value = true
  document.body.style.cursor = 'pointer'
}

function onPointerOut() {
  hovered.value = false
  document.body.style.cursor = ''
}

onBeforeUnmount(() => {
  if (hovered.value) document.body.style.cursor = ''
  geometry.dispose()
  material.dispose()
})
</script>

<template>
  <TresGroup :position="position" :rotation="rotation">
    <TresMesh
      ref="panelRef"
      :scale="HIDDEN_SCALE"
      :geometry="geometry"
      :material="material"
      @pointerover="onPointerOver"
      @pointerout="onPointerOut"
    >
      <Html
        transform
        center
        :position="[0, 0, 0.04]"
        :distance-factor="HTML_DISTANCE_FACTOR"
        pointer-events="none"
      >
        <article
          class="project-card"
          :class="{ 'is-hovered': hovered, 'is-revealed': revealed }"
          :style="{ '--accent': project.accent }"
        >
          <p class="project-card__tag">{{ project.tag }}</p>
          <h3 class="project-card__title">{{ project.title }}</h3>
          <p class="project-card__text">{{ project.description }}</p>
        </article>
      </Html>
    </TresMesh>
  </TresGroup>
</template>

<style scoped>
.project-card {
  width: 288px;
  height: 176px;
  padding: 20px 22px;
  border-radius: 14px;
  color: #f4f4f5;
  user-select: none;
  opacity: 0;
  transition:
    opacity 0.5s ease,
    box-shadow 0.35s ease,
    text-shadow 0.35s ease;
}

.project-card.is-revealed {
  opacity: 1;
}

.project-card.is-hovered {
  box-shadow: 0 0 36px -6px var(--accent);
  text-shadow: 0 0 14px var(--accent);
}

.project-card__tag {
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
}

.project-card__title {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 600;
}

.project-card__text {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.45;
  color: #d4d4d8;
}
</style>
