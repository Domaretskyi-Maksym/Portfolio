<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  Plane,
  Points,
  Raycaster,
  ShaderMaterial,
  Sphere,
  Vector3,
} from 'three'
import { onBeforeUnmount } from 'vue'
import { NEBULA_CENTER, NEBULA_RADIUS } from '../../three/nebula/cameraPath'
import { nebulaFragmentShader, nebulaVertexShader } from '../../three/nebula/shaders/nebula'
import { signalState } from '../../three/nebula/state'
import { getPointerSpeed, pointerState } from '../../three/pointer'

const PARTICLE_COUNT = 100_000
const MOUSE_RADIUS = 2.4
const MOUSE_BASE_STRENGTH = 1.1
const MOUSE_SPEED_STRENGTH = 0.5
const MOUSE_FOLLOW_LAMBDA = 6
const MOUSE_PLANE_MAX_DISTANCE = 6
const OFFSCREEN_MOUSE = new Vector3(1e4, 1e4, 1e4)

function createCloudGeometry(count: number, radius: number) {
  const positions = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const randoms = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = radius * Math.pow(Math.random(), 0.65)

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi) * 0.8
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    scales[i] = 0.4 + Math.random() ** 3 * 1.6
    randoms[i] = Math.random()
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aScale', new BufferAttribute(scales, 1))
  geometry.setAttribute('aRandom', new BufferAttribute(randoms, 1))
  geometry.boundingSphere = new Sphere(NEBULA_CENTER.clone(), radius * 2)
  return geometry
}

const geometry = createCloudGeometry(PARTICLE_COUNT, NEBULA_RADIUS)

const material = new ShaderMaterial({
  vertexShader: nebulaVertexShader,
  fragmentShader: nebulaFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uSize: { value: 42 },
    uPixelRatio: { value: 1 },
    uRadius: { value: NEBULA_RADIUS },
    uMouse: { value: OFFSCREEN_MOUSE.clone() },
    uMouseRadius: { value: MOUSE_RADIUS },
    uMouseStrength: { value: MOUSE_BASE_STRENGTH },
    uBurst: { value: 0 },
    uColorDeep: { value: new Color('#0b1d5c') },
    uColorMid: { value: new Color('#7c3aed') },
    uColorHot: { value: new Color('#ff4fd8') },
  },
  blending: AdditiveBlending,
  depthWrite: false,
  // Kept in the opaque render list so glass panels (transmission) can refract the nebula.
  transparent: false,
})

const points = new Points(geometry, material)
points.frustumCulled = false
// Raycasting 100k points on every pointer move would stall the main thread.
points.raycast = () => {}

const raycaster = new Raycaster()
const mousePlane = new Plane()
const viewDirection = new Vector3()
const planeAnchor = new Vector3()
const mouseTarget = OFFSCREEN_MOUSE.clone()

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed, delta, camera, renderer }) => {
  const activeCamera = camera.value
  if (!activeCamera) return

  const uniforms = material.uniforms
  uniforms.uTime.value = elapsed
  uniforms.uPixelRatio.value = renderer.getPixelRatio()
  uniforms.uBurst.value = signalState.burst

  if (pointerState.active) {
    activeCamera.getWorldDirection(viewDirection)
    const focusDistance = Math.min(activeCamera.position.distanceTo(NEBULA_CENTER), MOUSE_PLANE_MAX_DISTANCE)
    planeAnchor.copy(activeCamera.position).addScaledVector(viewDirection, focusDistance)
    mousePlane.setFromNormalAndCoplanarPoint(viewDirection, planeAnchor)

    raycaster.setFromCamera(pointerState.ndc, activeCamera)
    raycaster.ray.intersectPlane(mousePlane, mouseTarget)
  } else {
    mouseTarget.copy(OFFSCREEN_MOUSE)
  }

  const mouse = uniforms.uMouse.value as Vector3
  if (mouse.distanceToSquared(mouseTarget) > 1e6) {
    mouse.copy(mouseTarget)
  } else {
    mouse.x = MathUtils.damp(mouse.x, mouseTarget.x, MOUSE_FOLLOW_LAMBDA, delta)
    mouse.y = MathUtils.damp(mouse.y, mouseTarget.y, MOUSE_FOLLOW_LAMBDA, delta)
    mouse.z = MathUtils.damp(mouse.z, mouseTarget.z, MOUSE_FOLLOW_LAMBDA, delta)
  }

  const targetStrength = MOUSE_BASE_STRENGTH + getPointerSpeed(performance.now()) * MOUSE_SPEED_STRENGTH
  uniforms.uMouseStrength.value = MathUtils.damp(uniforms.uMouseStrength.value, targetStrength, 4, delta)
})

onBeforeUnmount(() => {
  geometry.dispose()
  material.dispose()
})
</script>

<template>
  <primitive :object="points" />
</template>
