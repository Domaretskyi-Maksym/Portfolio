import { CylinderGeometry, Curve, TorusGeometry, TubeGeometry, Vector3 } from 'three'
import type { ModelPart, ModelSpec } from '../types'

const BAND_RADIUS = 0.78
const CUP_Y = -0.62
const CUP_RADIUS = 0.27
const CUP_DEPTH = 0.16
const YOKE_RADIUS = 0.31

/** Arc in the XY plane from `start` to `end` radians, used for the headband and its cushion. */
class ArcCurve extends Curve<Vector3> {
  private readonly radius: number
  private readonly start: number
  private readonly end: number

  constructor(radius: number, start: number, end: number) {
    super()
    this.radius = radius
    this.start = start
    this.end = end
  }

  override getPoint(t: number, target = new Vector3()) {
    const angle = this.start + (this.end - this.start) * t
    return target.set(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius, 0)
  }
}

export function buildHeadphones(): ModelSpec {
  const band = new TubeGeometry(new ArcCurve(BAND_RADIUS, Math.PI, 0), 96, 0.05, 16)
  const cushion = new TubeGeometry(new ArcCurve(BAND_RADIUS - 0.07, Math.PI * 0.8, Math.PI * 0.2), 64, 0.045, 12)
  cushion.scale(1, 1, 2.3)

  const slider = new CylinderGeometry(0.022, 0.022, Math.abs(CUP_Y) - YOKE_RADIUS + 0.02, 12)
  const yoke = new TorusGeometry(YOKE_RADIUS, 0.024, 10, 48, Math.PI)
  yoke.rotateY(Math.PI / 2)
  const cup = new CylinderGeometry(CUP_RADIUS, CUP_RADIUS * 0.94, CUP_DEPTH, 48)
  cup.rotateZ(Math.PI / 2)
  const panel = new CylinderGeometry(CUP_RADIUS * 0.82, CUP_RADIUS * 0.9, 0.04, 48)
  panel.rotateZ(Math.PI / 2)
  const ring = new TorusGeometry(CUP_RADIUS * 0.7, 0.012, 8, 64)
  ring.rotateY(Math.PI / 2)
  const earPad = new TorusGeometry(CUP_RADIUS * 0.78, 0.075, 16, 48)
  earPad.rotateY(Math.PI / 2)
  earPad.scale(0.75, 1, 1)

  const sides: ModelPart[] = [-1, 1].flatMap((side) => [
    { geometry: slider, slot: 'metal', position: [side * BAND_RADIUS, -(Math.abs(CUP_Y) - YOKE_RADIUS) / 2, 0], explode: [side * 0.18, 0.28, 0] },
    { geometry: yoke, slot: 'metal', position: [side * BAND_RADIUS, CUP_Y, 0], explode: [side * 0.3, 0.05, 0] },
    { geometry: cup, slot: 'primary', position: [side * BAND_RADIUS, CUP_Y, 0], explode: [side * 0.5, 0, 0] },
    { geometry: panel, slot: 'secondary', position: [side * (BAND_RADIUS + CUP_DEPTH / 2 + 0.01), CUP_Y, 0], explode: [side * 0.85, 0, 0] },
    { geometry: ring, slot: 'accent', position: [side * (BAND_RADIUS + CUP_DEPTH / 2 + 0.032), CUP_Y, 0], explode: [side * 1.05, 0, 0] },
    { geometry: earPad, slot: 'soft', position: [side * (BAND_RADIUS - CUP_DEPTH / 2 - 0.04), CUP_Y, 0], explode: [-side * 0.32, 0, 0] },
  ])

  return {
    parts: [
      { geometry: band, slot: 'primary', explode: [0, 0.5, 0] },
      { geometry: cushion, slot: 'soft', explode: [0, 0.24, 0] },
      ...sides,
    ],
  }
}
