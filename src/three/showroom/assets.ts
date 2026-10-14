import { BoxGeometry, CanvasTexture, MeshStandardMaterial, SRGBColorSpace } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { RigSharedAssets } from './ProductRig'

const PARCEL_SIZE: [number, number, number] = [1.3, 1, 1.3]

/** Soft radial blob used as a contact shadow under every model. */
function createShadowTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(15, 18, 28, 0.85)')
  gradient.addColorStop(0.45, 'rgba(15, 18, 28, 0.35)')
  gradient.addColorStop(1, 'rgba(15, 18, 28, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

export function createRigSharedAssets(): RigSharedAssets {
  return {
    shadowTexture: createShadowTexture(),
    parcelGeometry: new RoundedBoxGeometry(...PARCEL_SIZE, 4, 0.08),
    parcelMaterial: new MeshStandardMaterial({ color: '#c79a6b', roughness: 0.85 }),
    tapeGeometry: new BoxGeometry(0.28, PARCEL_SIZE[1] + 0.01, PARCEL_SIZE[2] + 0.01),
    tapeMaterial: new MeshStandardMaterial({ color: '#2b2f3a', roughness: 0.4, metalness: 0.1 }),
  }
}

export function disposeRigSharedAssets(assets: RigSharedAssets) {
  assets.shadowTexture.dispose()
  assets.parcelGeometry.dispose()
  assets.parcelMaterial.dispose()
  assets.tapeGeometry.dispose()
  assets.tapeMaterial.dispose()
}
