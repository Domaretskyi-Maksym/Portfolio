import { CONVEYOR_ORIGIN, FLOOR_Y } from './layout'

/** Shared conveyor dimensions (local to `CONVEYOR_ORIGIN`, whose Y is the belt's top surface). */
export const BELT_LENGTH = 6
export const BELT_WIDTH = 1.3
export const BELT_THICKNESS = 0.08
/** Belt surface speed at 1× mechanism speed (units/s). */
export const BELT_SPEED = 0.45
export const RAIL_HEIGHT = 0.2
export const RAIL_THICKNESS = 0.06
export const RAIL_Z = BELT_WIDTH / 2 + 0.06
export const MOTOR_SIZE: [number, number, number] = [0.7, 0.8, 1.1]
export const MOTOR_POSITION: [number, number, number] = [-BELT_LENGTH / 2 - 0.55, -0.3, 0]
export const FLOOR_LOCAL_Y = FLOOR_Y - CONVEYOR_ORIGIN[1]

export const BLOCK_SIZE = 0.7

/** Glass gate arching over the belt middle: half-torus standing in the YZ plane. */
export const GATE_ARGS: [radius: number, tube: number, radialSegments: number, tubularSegments: number, arc: number] = [
  0.98,
  0.07,
  16,
  64,
  Math.PI,
]
export const GATE_ROTATION: [number, number, number] = [0, Math.PI / 2, 0]
