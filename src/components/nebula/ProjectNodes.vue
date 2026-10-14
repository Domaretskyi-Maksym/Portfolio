<script setup lang="ts">
import { useTres } from '@tresjs/core'
import { Object3D, PMREMGenerator, Vector3, WebGLRenderer, type Texture } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { onBeforeUnmount, onMounted } from 'vue'
import { projects } from '../../data/projects'
import { cameraPath, PROJECT_PATH_STOPS } from '../../three/nebula/cameraPath'
import ProjectNode from './ProjectNode.vue'

const SIDE_OFFSET = 1.0
const LIFT = 0.2
const FACE_BACK_STEP = 0.04
const ENVIRONMENT_INTENSITY = 0.35

const UP = new Vector3(0, 1, 0)

/** Panels sit beside the path, alternating sides, turned towards the approaching camera. */
const nodes = projects.slice(0, PROJECT_PATH_STOPS.length).map((project, index) => {
  const t = PROJECT_PATH_STOPS[index]
  const point = cameraPath.getPointAt(t)
  const side = new Vector3().crossVectors(cameraPath.getTangentAt(t), UP).normalize()
  const direction = index % 2 === 0 ? 1 : -1

  const placement = new Object3D()
  placement.position.copy(point).addScaledVector(side, SIDE_OFFSET * direction)
  placement.position.y += LIFT
  placement.lookAt(cameraPath.getPointAt(Math.max(t - FACE_BACK_STEP, 0)))

  return {
    project,
    position: placement.position.toArray() as [number, number, number],
    rotation: [placement.rotation.x, placement.rotation.y, placement.rotation.z] as [number, number, number],
  }
})

const { scene, renderer } = useTres()
let environment: Texture | null = null

onMounted(() => {
  // Transmission glass looks flat black without something to reflect.
  if (!(renderer instanceof WebGLRenderer)) return
  const pmrem = new PMREMGenerator(renderer)
  environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  scene.value.environment = environment
  scene.value.environmentIntensity = ENVIRONMENT_INTENSITY
})

onBeforeUnmount(() => {
  if (scene.value.environment === environment) scene.value.environment = null
  environment?.dispose()
})
</script>

<template>
  <TresGroup>
    <ProjectNode
      v-for="node in nodes"
      :key="node.project.id"
      :project="node.project"
      :position="node.position"
      :rotation="node.rotation"
    />
  </TresGroup>
</template>
