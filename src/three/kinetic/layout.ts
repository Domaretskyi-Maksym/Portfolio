import { Vector3 } from 'three'
import type { Vec3 } from './types'

export const FLOOR_Y = -3.6

/**
 * The core mechanism is built in world coordinates at the origin: rapier bodies
 * write world transforms straight into their groups, so their parents must not be offset.
 */
export const CONVEYOR_ORIGIN: Vec3 = [11, -2.6, 4]
export const SCREENS_ORIGIN: Vec3 = [-11, -0.8, 3]
export const MATERIAL_SAMPLES_ORIGIN: Vec3 = [-6.4, FLOOR_Y, 2.2]

export type CameraNodeId = 'core' | 'conveyor' | 'screens'

export interface CameraNode {
  id: CameraNodeId
  position: Vec3
  target: Vec3
}

export const CAMERA_NODES: CameraNode[] = [
  { id: 'core', position: [0.5, 0.8, 12], target: [1.6, -0.2, 0] },
  { id: 'conveyor', position: [11.6, -0.9, 7.6], target: [11.2, -2.5, 4] },
  { id: 'screens', position: [-9.6, -0.2, 8.2], target: [-10.2, -0.8, 3] },
]

/** World point the camera is looking at — depth of field auto-focuses on it. */
export const cameraFocus = new Vector3(...CAMERA_NODES[0].target)
