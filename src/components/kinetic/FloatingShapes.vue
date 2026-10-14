<script setup lang="ts">
import { Levioso } from '@tresjs/cientos'
import { useKineticMaterials } from '../../composables/useKineticMaterials'
import type { Vec3 } from '../../three/kinetic/types'

/** Bauhaus primitives drifting around the machine (cientos Levioso ≈ drei Float). */
type ShapeKind = 'cone' | 'torus' | 'sphere' | 'cube' | 'icosahedron'
type ShapeFinish = 'red' | 'yellow' | 'blue' | 'steel' | 'glass'

interface FloatingShape {
  kind: ShapeKind
  finish: ShapeFinish
  position: Vec3
  rotation: Vec3
  speed: number
}

const SHAPES: FloatingShape[] = [
  { kind: 'cone', finish: 'red', position: [-5.4, 3.4, -1.2], rotation: [0.3, 0, 0.5], speed: 1.1 },
  { kind: 'torus', finish: 'yellow', position: [6.6, 3.8, -1.6], rotation: [0.9, 0.3, 0], speed: 0.8 },
  { kind: 'sphere', finish: 'blue', position: [6.2, -1.2, 1.6], rotation: [0, 0, 0], speed: 1.3 },
  { kind: 'cube', finish: 'steel', position: [-4.4, -0.2, 2.6], rotation: [0.5, 0.6, 0.2], speed: 1 },
  { kind: 'icosahedron', finish: 'glass', position: [2.6, 5.4, -2.2], rotation: [0.2, 0.4, 0], speed: 0.9 },
]

const { plastic, brushedSteel, frostedGlass } = useKineticMaterials()

const materialFor = (finish: ShapeFinish) =>
  finish === 'steel' ? brushedSteel : finish === 'glass' ? frostedGlass : plastic[finish]
</script>

<template>
  <TresGroup v-for="(shape, index) in SHAPES" :key="index" :position="shape.position">
    <Levioso :speed="shape.speed" :rotation-factor="1.2" :float-factor="1.4" :range="[-0.25, 0.25]">
      <TresMesh :material="materialFor(shape.finish)" :rotation="shape.rotation" cast-shadow receive-shadow>
        <TresConeGeometry v-if="shape.kind === 'cone'" :args="[0.45, 0.9, 48]" />
        <TresTorusGeometry v-else-if="shape.kind === 'torus'" :args="[0.42, 0.14, 24, 64]" />
        <TresSphereGeometry v-else-if="shape.kind === 'sphere'" :args="[0.42, 48, 32]" />
        <TresBoxGeometry v-else-if="shape.kind === 'cube'" :args="[0.62, 0.62, 0.62]" />
        <TresIcosahedronGeometry v-else :args="[0.5, 0]" />
      </TresMesh>
    </Levioso>
  </TresGroup>
</template>
