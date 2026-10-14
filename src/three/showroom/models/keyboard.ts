import { BoxGeometry, type BufferGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { ModelSpec } from '../types'

const UNIT = 0.115
const KEY_GAP = 0.012
const CASE: [number, number, number] = [2.02, 0.16, 0.74]
const PLATE_Y = CASE[1] / 2 + 0.015
const SWITCH_Y = PLATE_Y + 0.045
const KEYCAP_Y = PLATE_Y + 0.095

/** 65% layout: key widths in units per row, every row 16u wide. */
const ROWS: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 1],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25, 1],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75, 1, 1],
  [1.25, 1.25, 1.25, 6.25, 1, 1, 1, 1, 1, 1],
]

function buildKeys() {
  const alphas: BufferGeometry[] = []
  const modifiers: BufferGeometry[] = []
  const switches: BufferGeometry[] = []
  const rowWidth = 16 * UNIT

  ROWS.forEach((row, rowIndex) => {
    const z = (rowIndex - (ROWS.length - 1) / 2) * UNIT
    let x = -rowWidth / 2
    row.forEach((width, keyIndex) => {
      const centerX = x + (width * UNIT) / 2
      x += width * UNIT

      const cap = new RoundedBoxGeometry(width * UNIT - KEY_GAP, 0.07, UNIT - KEY_GAP, 2, 0.016)
      cap.translate(centerX, KEYCAP_Y, z)
      const isModifier = width !== 1 || (rowIndex === 0 && keyIndex === 0)
      ;(isModifier ? modifiers : alphas).push(cap)

      const housing = new BoxGeometry(0.075, 0.05, 0.075)
      housing.translate(centerX, SWITCH_Y, z)
      switches.push(housing)
    })
  })

  return {
    alphas: mergeGeometries(alphas)!,
    modifiers: mergeGeometries(modifiers)!,
    switches: mergeGeometries(switches)!,
  }
}

export function buildKeyboard(): ModelSpec {
  const { alphas, modifiers, switches } = buildKeys()
  return {
    rotation: [0.62, 0, 0],
    parts: [
      { geometry: alphas, slot: 'secondary', explode: [0, 0.62, 0] },
      { geometry: modifiers, slot: 'accent', explode: [0, 0.62, 0] },
      { geometry: switches, slot: 'soft', explode: [0, 0.38, 0] },
      { geometry: new BoxGeometry(CASE[0] - 0.08, 0.03, CASE[2] - 0.08), slot: 'metal', position: [0, PLATE_Y, 0], explode: [0, 0.2, 0] },
      { geometry: new RoundedBoxGeometry(...CASE, 4, 0.05), slot: 'primary', explode: [0, 0, 0] },
    ],
  }
}
