import { Vector2 } from 'three'

/** Window pointer in NDC (-1..1), shared by every scene. Plain object: read every frame. */
export const pointerState = {
  ndc: new Vector2(0, 0),
  active: false,
}
