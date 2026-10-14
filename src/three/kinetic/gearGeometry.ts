import {
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Shape,
  TorusGeometry,
  Vector2,
  type BufferGeometry,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export interface GearShape {
  teeth: number
  /** Metric gear module: pitch diameter = teeth × module. */
  module: number
  thickness: number
}

export function gearPitchRadius(teeth: number, module: number) {
  return (teeth * module) / 2
}

function gearRootRadius({ teeth, module }: GearShape) {
  return gearPitchRadius(teeth, module) - module * 1.1
}

function gearBoltCircleRadius(shape: GearShape) {
  return gearRootRadius(shape) * 0.62
}

/** mergeGeometries needs every part to share the same index layout. */
function merge(parts: BufferGeometry[], label: string) {
  const normalized = parts.map((part) => (part.index ? part.toNonIndexed() : part))
  const merged = mergeGeometries(normalized)
  for (const part of new Set([...parts, ...normalized])) part.dispose()
  if (!merged) throw new Error(`${label}: failed to merge geometry parts`)
  return merged
}

/** Disc with chamfered rims, revolved around +Y. */
function createChamferedDisc(radius: number, thickness: number, chamfer: number, segments: number) {
  const half = thickness / 2
  const profile = [
    new Vector2(0, -half),
    new Vector2(radius - chamfer, -half),
    new Vector2(radius, -half + chamfer),
    new Vector2(radius, half - chamfer),
    new Vector2(radius - chamfer, half),
    new Vector2(0, half),
  ]
  return new LatheGeometry(profile, segments)
}

/** Tapered, bevelled tooth: width across X, height along local Z (radial), thickness along Y. */
function createTooth(module: number, thickness: number) {
  const baseWidth = Math.PI * module * 0.58
  const tipWidth = baseWidth * 0.55
  const height = module * 2.1
  const bevel = Math.min(module * 0.12, thickness * 0.08)

  const shape = new Shape()
  shape.moveTo(-baseWidth / 2, 0)
  shape.lineTo(baseWidth / 2, 0)
  shape.lineTo(tipWidth / 2, height)
  shape.lineTo(-tipWidth / 2, height)
  shape.closePath()

  const tooth = new ExtrudeGeometry(shape, {
    depth: thickness - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 1,
    curveSegments: 1,
  })
  tooth.translate(0, 0, -(thickness - bevel * 2) / 2)
  // Shape plane XY → radial axis becomes +Z, extrusion depth becomes the gear axis (Y).
  tooth.rotateX(Math.PI / 2)
  return tooth
}

/**
 * Procedural spur gear with its axis along local +Y (CylinderGeometry convention).
 * Tooth `i` points at angle 2πi/teeth in the plane the gear faces once rotated by +90° around X,
 * which is what the gear-train phase maths assumes.
 */
export function createGearGeometry(shape: GearShape): BufferGeometry {
  const { teeth, module, thickness } = shape
  const rootRadius = gearRootRadius(shape)
  const hubRadius = Math.max(rootRadius * 0.28, module * 2)
  const chamfer = Math.min(module * 0.35, thickness * 0.18)

  const parts: BufferGeometry[] = [
    createChamferedDisc(rootRadius, thickness, chamfer, Math.max(teeth * 3, 48)),
    createChamferedDisc(hubRadius, thickness * 1.5, chamfer * 0.8, 32),
    // Raised web ring between the hub and the rim — reads as a machined face.
    createChamferedDisc(rootRadius * 0.78, thickness * 1.12, chamfer * 0.6, Math.max(teeth * 2, 40)),
  ]

  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2
    const tooth = createTooth(module, thickness)
    tooth.translate(0, 0, rootRadius - module * 0.25)
    tooth.rotateY(angle + Math.PI / 2)
    parts.push(tooth)
  }

  return merge(parts, 'createGearGeometry')
}

/**
 * Steel micro-details for a gear: hex bolts on the front face, an axle collar and a nut.
 * Same axis convention as `createGearGeometry`; the front face is +Y before the gear is stood up.
 */
export function createGearDetailGeometry(shape: GearShape): BufferGeometry {
  const { teeth, module, thickness } = shape
  const rootRadius = gearRootRadius(shape)
  const hubRadius = Math.max(rootRadius * 0.28, module * 2)
  const frontY = (thickness * 1.12) / 2
  const boltRadius = gearBoltCircleRadius(shape)
  const boltCount = Math.min(8, Math.max(4, Math.round(teeth / 4)))
  const boltSize = Math.max(module * 0.42, 0.035)

  const parts: BufferGeometry[] = []

  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2 + Math.PI / boltCount
    const bolt = new CylinderGeometry(boltSize, boltSize, boltSize * 0.9, 6)
    bolt.translate(Math.cos(angle) * boltRadius, frontY + boltSize * 0.45, Math.sin(angle) * boltRadius)
    parts.push(bolt)
  }

  const collarRadius = hubRadius * 0.82
  const collar = new CylinderGeometry(collarRadius, collarRadius * 1.04, thickness * 0.5, 32)
  collar.translate(0, (thickness * 1.5) / 2 + thickness * 0.25, 0)
  parts.push(collar)

  const nut = new CylinderGeometry(collarRadius * 0.55, collarRadius * 0.55, thickness * 0.32, 6)
  nut.translate(0, (thickness * 1.5) / 2 + thickness * 0.5 + thickness * 0.16, 0)
  parts.push(nut)

  const rimBand = new TorusGeometry(rootRadius * 0.78, module * 0.12, 6, Math.max(teeth * 2, 40))
  rimBand.rotateX(Math.PI / 2)
  rimBand.translate(0, frontY, 0)
  parts.push(rimBand)

  return merge(parts, 'createGearDetailGeometry')
}

/** Ring of hex bolt heads in the XY plane facing +Z (for plates and bases). */
export function createBoltRowGeometry(points: Array<[number, number]>, size: number): BufferGeometry {
  const parts = points.map(([x, y]) => {
    const bolt = new CylinderGeometry(size, size, size * 0.8, 6)
    bolt.rotateX(Math.PI / 2)
    bolt.translate(x, y, size * 0.4)
    return bolt
  })
  return merge(parts, 'createBoltRowGeometry')
}
