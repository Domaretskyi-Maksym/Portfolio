<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import {
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  type WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { onUnmounted, watch } from 'vue'
import { useViewRegistry } from '../../composables/useProductView'
import { useShop } from '../../composables/useShop'
import { products } from '../../data/products'
import { createRigSharedAssets, disposeRigSharedAssets } from '../../three/showroom/assets'
import { disposeModelSpecs, getModelSpec } from '../../three/showroom/models'
import { ProductRig } from '../../three/showroom/ProductRig'
import type { ProductView, ViewMode } from '../../three/showroom/viewRegistry'

/**
 * The single showroom scene. Every product has one rig; each frame the rig is shown only while
 * its view's rectangle is drawn (scissor + viewport), so the whole catalog costs one canvas.
 */
const FOV = 30
/** Extra room around the unit-sphere model per view mode. */
const FRAMING: Record<ViewMode, number> = { card: 1.2, hero: 1.06, flight: 1.02 }
const CAMERA_ELEVATION: Record<ViewMode, number> = { card: 0.2, hero: 0.12, flight: 0 }
const FLASHLIGHT_INTENSITY = 14
const MAX_DELTA = 1 / 20

const { scene, renderer } = useTres()
const registry = useViewRegistry()
const shop = useShop()
const gl = renderer as WebGLRenderer

const assets = createRigSharedAssets()
const rigs = new Map(
  products.map((product) => {
    const rig = new ProductRig(product, getModelSpec(product.model), assets)
    rig.setColorway(shop.colorwayOf(product), false)
    scene.value.add(rig.root)
    return [product.id, rig] as const
  }),
)

const camera = new PerspectiveCamera(FOV, 1, 0.1, 40)
const keyLight = new DirectionalLight('#fff4e6', 2.1)
keyLight.position.set(3, 5, 4)
const rimLight = new DirectionalLight('#d6e4ff', 1.3)
rimLight.position.set(-4, 2.5, -3)
const skyLight = new HemisphereLight('#ffffff', '#d9d4cc', 0.35)
/** Cursor "flashlight": follows the pointer of the view being drawn. */
const flashlight = new PointLight('#fff1dc', 0, 6, 1.6)
scene.value.add(keyLight, rimLight, skyLight, flashlight)

const pmrem = new PMREMGenerator(gl)
const environment = pmrem.fromScene(new RoomEnvironment(), 0.04)
pmrem.dispose()
scene.value.environment = environment.texture
scene.value.environmentIntensity = 0.85

watch(
  () => ({ ...shop.state.colorways }),
  (current, previous) => {
    for (const id of Object.keys(current)) {
      if (current[id] === previous[id]) continue
      const rig = rigs.get(id)
      if (rig) rig.setColorway(shop.colorwayOf(rig.product), true)
    }
  },
)

function frameCamera(aspect: number, radius: number, elevation: number) {
  camera.aspect = aspect
  const verticalHalf = MathUtils.degToRad(FOV / 2)
  const horizontalHalf = Math.atan(Math.tan(verticalHalf) * aspect)
  const distance = radius / Math.sin(Math.min(verticalHalf, horizontalHalf))
  camera.position.set(0, Math.sin(elevation) * distance, Math.cos(elevation) * distance)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()
}

function placeFlashlight(view: ProductView) {
  flashlight.intensity = view.glow * FLASHLIGHT_INTENSITY
  flashlight.position.set(view.pointer.x * 1.5, view.pointer.y * 1.2 + 0.25, 1.9)
}

let activeViews = new Map<string, ProductView>()
let compiled = false

const { onBeforeRender, render } = useLoop()

onBeforeRender(({ delta }) => {
  const dt = Math.min(delta, MAX_DELTA)
  activeViews = registry.resolve()
  activeViews.forEach((view, productId) => rigs.get(productId)?.update(dt, view, !!shop.state.exploded[productId]))
})

render((notifyFrameRendered) => {
  if (!compiled) {
    rigs.forEach((rig) => (rig.root.visible = true))
    gl.compile(scene.value, camera)
    rigs.forEach((rig) => (rig.root.visible = false))
    compiled = true
  }

  const width = gl.domElement.clientWidth
  const height = gl.domElement.clientHeight
  const clipTop = registry.clipEl?.getBoundingClientRect().bottom ?? 0

  gl.setScissorTest(false)
  gl.setClearColor(0x000000, 0)
  gl.clear()
  gl.setScissorTest(true)

  activeViews.forEach((view, productId) => {
    const rig = rigs.get(productId)
    if (!rig || (view.presence < 0.001 && view.presenceTarget === 0)) return

    const rect = view.el.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) return
    const top = Math.max(rect.top, view.clip ? clipTop : 0)
    const bottom = Math.min(rect.bottom, height)
    const left = Math.max(rect.left, 0)
    const right = Math.min(rect.right, width)
    if (bottom <= top || right <= left) return

    gl.setViewport(rect.left, height - rect.bottom, rect.width, rect.height)
    gl.setScissor(left, height - bottom, right - left, bottom - top)
    frameCamera(rect.width / rect.height, rig.frameRadius * FRAMING[view.mode], CAMERA_ELEVATION[view.mode])
    placeFlashlight(view)
    rig.prepareForView(view)

    rig.root.visible = true
    gl.render(scene.value, camera)
    rig.root.visible = false
  })

  gl.setScissorTest(false)
  notifyFrameRendered()
})

onUnmounted(() => {
  rigs.forEach((rig) => {
    scene.value.remove(rig.root)
    rig.dispose()
  })
  scene.value.remove(keyLight, rimLight, skyLight, flashlight)
  scene.value.environment = null
  environment.dispose()
  disposeRigSharedAssets(assets)
  disposeModelSpecs()
})
</script>

<template>
  <!-- Rendered imperatively by the custom render function above. -->
  <TresGroup />
</template>
