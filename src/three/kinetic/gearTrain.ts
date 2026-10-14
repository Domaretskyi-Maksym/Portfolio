import { gearPitchRadius } from './gearGeometry'
import type { Vec3 } from './types'

export const GEAR_MODULE = 0.12
export const GEAR_THICKNESS = 0.35

export type GearFinish = 'steel' | 'red' | 'blue' | 'yellow'

export interface GearSpec {
  id: string
  teeth: number
  finish: GearFinish
  explodeOffset: Vec3
  /** Gear this one meshes with, and the direction (degrees) from the parent's centre to this one. */
  meshesWith?: { parent: string; angleDeg: number }
}

export interface GearPlacement extends GearSpec {
  position: Vec3
  /** Gear angle = ratio × masterAngle + phase. */
  ratio: number
  phase: number
}

/**
 * Places gears so their pitch circles touch and phases them so teeth interlock.
 * Specs must list a parent before any gear that meshes with it.
 */
export function buildGearTrain(specs: GearSpec[]): GearPlacement[] {
  const placed = new Map<string, GearPlacement>()

  for (const spec of specs) {
    if (!spec.meshesWith) {
      placed.set(spec.id, { ...spec, position: [0, 0, 0], ratio: 1, phase: 0 })
      continue
    }

    const parent = placed.get(spec.meshesWith.parent)
    if (!parent) throw new Error(`buildGearTrain: "${spec.id}" meshes with unknown gear "${spec.meshesWith.parent}"`)

    const alpha = (spec.meshesWith.angleDeg * Math.PI) / 180
    const distance = gearPitchRadius(parent.teeth, GEAR_MODULE) + gearPitchRadius(spec.teeth, GEAR_MODULE)
    const toothRatio = parent.teeth / spec.teeth

    placed.set(spec.id, {
      ...spec,
      position: [
        parent.position[0] + Math.cos(alpha) * distance,
        parent.position[1] + Math.sin(alpha) * distance,
        parent.position[2],
      ],
      ratio: -toothRatio * parent.ratio,
      // Child faces the contact point at α+π, rolls opposite to the parent, and sits half a tooth
      // pitch off so a gap meets each parent tooth.
      phase: -toothRatio * parent.phase + alpha + Math.PI + alpha * toothRatio + Math.PI / spec.teeth,
    })
  }

  return [...placed.values()]
}

export const GEAR_TRAIN = buildGearTrain([
  { id: 'main', teeth: 28, finish: 'steel', explodeOffset: [0, 0, 0.6] },
  { id: 'drive', teeth: 14, finish: 'red', explodeOffset: [1.4, 0.8, 1.2], meshesWith: { parent: 'main', angleDeg: 25 } },
  { id: 'idler', teeth: 20, finish: 'blue', explodeOffset: [0.9, 1.6, -0.9], meshesWith: { parent: 'drive', angleDeg: 100 } },
  { id: 'transfer', teeth: 18, finish: 'yellow', explodeOffset: [-1.5, -0.4, 1], meshesWith: { parent: 'main', angleDeg: 200 } },
  { id: 'pinion', teeth: 10, finish: 'steel', explodeOffset: [-1.2, -1.4, 2], meshesWith: { parent: 'transfer', angleDeg: 250 } },
])
