import { BoxGeometry, CircleGeometry, CylinderGeometry, LatheGeometry, TorusGeometry, Vector2 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { ModelPart, ModelSpec } from '../types'

const CASE_RADIUS = 0.44
const CASE_FRONT = 0.07
const DIAL_RADIUS = 0.385
const TAU = Math.PI * 2

/** Hand pivoting at its base so `rotation.z` sweeps it around the dial centre. */
function createHand(width: number, length: number, tail: number) {
  const hand = new BoxGeometry(width, length + tail, 0.008)
  hand.translate(0, (length - tail) / 2, 0)
  return hand
}

function createCase() {
  const profile = [
    new Vector2(0, -CASE_FRONT),
    new Vector2(CASE_RADIUS - 0.03, -CASE_FRONT),
    new Vector2(CASE_RADIUS, -0.035),
    new Vector2(CASE_RADIUS + 0.008, 0.02),
    new Vector2(CASE_RADIUS - 0.02, CASE_FRONT),
    new Vector2(0, CASE_FRONT),
  ]
  const body = new LatheGeometry(profile, 72)
  body.rotateX(Math.PI / 2)

  const lugs = [-1, 1].flatMap((x) =>
    [-1, 1].map((y) => {
      const lug = new BoxGeometry(0.07, 0.16, 0.07)
      lug.translate(x * 0.24, y * (CASE_RADIUS + 0.04), -0.015)
      return lug.toNonIndexed()
    }),
  )
  return mergeGeometries([body.toNonIndexed(), ...lugs])!
}

function createIndices() {
  const marks = Array.from({ length: 12 }, (_, index) => {
    const major = index % 3 === 0
    const mark = new BoxGeometry(major ? 0.03 : 0.016, major ? 0.075 : 0.05, 0.01)
    mark.translate(0, DIAL_RADIUS - 0.07, 0)
    mark.rotateZ((index / 12) * TAU)
    return mark
  })
  return mergeGeometries(marks)!
}

function createStrap(direction: 1 | -1) {
  const near = new RoundedBoxGeometry(0.36, 0.5, 0.05, 3, 0.02)
  near.rotateX(direction * 0.22)
  near.translate(0, direction * 0.72, -0.05)
  const far = new RoundedBoxGeometry(0.34, 0.45, 0.05, 3, 0.02)
  far.rotateX(direction * 0.75)
  far.translate(0, direction * 1.12, -0.24)
  return mergeGeometries([near, far])!
}

export function buildWatch(): ModelSpec {
  const bezel = new TorusGeometry(CASE_RADIUS - 0.03, 0.03, 12, 72)
  const glass = new CylinderGeometry(DIAL_RADIUS + 0.01, DIAL_RADIUS + 0.01, 0.03, 64)
  glass.rotateX(Math.PI / 2)
  const crown = new CylinderGeometry(0.042, 0.042, 0.07, 24)
  crown.rotateZ(Math.PI / 2)
  const buckle = new TorusGeometry(0.11, 0.018, 8, 32)
  buckle.rotateX(Math.PI / 2 + 0.75)

  const parts: ModelPart[] = [
    { geometry: glass, slot: 'glass', position: [0, 0, CASE_FRONT + 0.03], explode: [0, 0, 1] },
    { geometry: bezel, slot: 'accent', position: [0, 0, CASE_FRONT + 0.004], explode: [0, 0, 0.82] },
    { id: 'second', geometry: createHand(0.008, 0.33, 0.08), slot: 'accent', position: [0, 0, CASE_FRONT + 0.016], explode: [0, 0, 0.66] },
    { id: 'minute', geometry: createHand(0.02, 0.3, 0), slot: 'metal', position: [0, 0, CASE_FRONT + 0.012], explode: [0, 0, 0.56] },
    { id: 'hour', geometry: createHand(0.028, 0.2, 0), slot: 'metal', position: [0, 0, CASE_FRONT + 0.008], explode: [0, 0, 0.46] },
    { geometry: createIndices(), slot: 'metal', position: [0, 0, CASE_FRONT + 0.004], explode: [0, 0, 0.34] },
    { geometry: new CircleGeometry(DIAL_RADIUS, 64), slot: 'secondary', position: [0, 0, CASE_FRONT + 0.001], explode: [0, 0, 0.22] },
    { geometry: createCase(), slot: 'metal', explode: [0, 0, 0] },
    { geometry: crown, slot: 'metal', position: [CASE_RADIUS + 0.04, 0, 0], explode: [0.38, 0, 0] },
    { geometry: createStrap(1), slot: 'primary', explode: [0, 0.32, -0.12] },
    { geometry: createStrap(-1), slot: 'primary', explode: [0, -0.32, -0.12] },
    { geometry: buckle, slot: 'metal', position: [0, -1.3, -0.36], explode: [0, -0.48, -0.16] },
  ]

  return {
    parts,
    animate(byId) {
      const now = new Date()
      const seconds = now.getSeconds() + now.getMilliseconds() / 1000
      const minutes = now.getMinutes() + seconds / 60
      const hours = (now.getHours() % 12) + minutes / 60
      if (byId.second) byId.second.rotation.z = -(seconds / 60) * TAU
      if (byId.minute) byId.minute.rotation.z = -(minutes / 60) * TAU
      if (byId.hour) byId.hour.rotation.z = -(hours / 12) * TAU
    },
  }
}
