import { Vector2 } from 'three'

/** Window pointer in NDC (-1..1), shared by every scene. Plain object: read every frame. */
export const pointerState = {
  ndc: new Vector2(0, 0),
  active: false,
  speed: 0,
  lastMoveAt: 0,
}

const POINTER_SPEED_DECAY_MS = 140

export function getPointerSpeed(now: number) {
  const idle = now - pointerState.lastMoveAt
  return pointerState.speed * Math.exp(-idle / POINTER_SPEED_DECAY_MS)
}
