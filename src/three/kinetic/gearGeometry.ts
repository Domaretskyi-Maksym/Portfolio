import { BoxGeometry, CylinderGeometry, type BufferGeometry } from 'three'
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

/**
 * Procedural spur gear with its axis along local +Y (CylinderGeometry convention).
 * Tooth `i` points at angle 2πi/teeth in the plane the gear faces once rotated by +90° around X,
 * which is what the gear-train phase maths assumes.
 */
export function createGearGeometry({ teeth, module, thickness }: GearShape): BufferGeometry {
  const pitchRadius = gearPitchRadius(teeth, module)
  const rootRadius = pitchRadius - module * 1.1
  const toothDepth = module * 2.1
  const toothWidth = Math.PI * module * 0.5
  const hubRadius = Math.max(rootRadius * 0.28, module * 2)

  const parts: BufferGeometry[] = [
    new CylinderGeometry(rootRadius, rootRadius, thickness, Math.max(teeth * 2, 32)),
    new CylinderGeometry(hubRadius, hubRadius, thickness * 1.5, 24),
  ]

  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2
    const tooth = new BoxGeometry(toothWidth, thickness, toothDepth)
    tooth.translate(0, 0, rootRadius + toothDepth / 2 - module * 0.2)
    tooth.rotateY(angle + Math.PI / 2)
    parts.push(tooth)
  }

  const merged = mergeGeometries(parts)
  for (const part of parts) part.dispose()
  if (!merged) throw new Error('createGearGeometry: failed to merge gear parts')
  return merged
}
