import { BoxGeometry, CylinderGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { ModelSpec } from '../types'

const BOTTLE: [number, number, number] = [0.9, 1, 0.5]
const BOTTLE_TOP = BOTTLE[1] / 2

export function buildPerfume(): ModelSpec {
  return {
    parts: [
      { geometry: new RoundedBoxGeometry(0.44, 0.44, 0.44, 4, 0.06), slot: 'secondary', position: [0, BOTTLE_TOP + 0.36, 0], explode: [0, 0.8, 0] },
      { geometry: new CylinderGeometry(0.034, 0.034, 0.1, 16), slot: 'metal', position: [0, BOTTLE_TOP + 0.19, 0], explode: [0, 0.56, 0] },
      { geometry: new CylinderGeometry(0.08, 0.1, 0.14, 32), slot: 'metal', position: [0, BOTTLE_TOP + 0.07, 0], explode: [0, 0.4, 0] },
      { geometry: new CylinderGeometry(0.15, 0.15, 0.05, 48), slot: 'accent', position: [0, BOTTLE_TOP + 0.02, 0], explode: [0, 0.26, 0] },
      { geometry: new RoundedBoxGeometry(...BOTTLE, 6, 0.12), slot: 'glass', explode: [0, 0, 0.6] },
      { geometry: new RoundedBoxGeometry(0.76, 0.7, 0.36, 4, 0.08), slot: 'primary', position: [0, -0.1, 0], explode: [0, -0.05, 0] },
      { geometry: new BoxGeometry(0.36, 0.12, 0.012), slot: 'accent', position: [0, 0.12, BOTTLE[2] / 2 + 0.008], explode: [0, 0.05, 0.95] },
    ],
    slotOverrides: {
      primary: { roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0 },
    },
  }
}
