import { CatmullRomCurve3, Vector3 } from 'three'

export const NEBULA_RADIUS = 6
export const NEBULA_CENTER = new Vector3(0, 0, 0)

/** Orbit around the cloud → dive through its core → exit and turn back to face it. */
export const CAMERA_PATH_POINTS = [
  new Vector3(0, 2, 22),
  new Vector3(15, 4, 13),
  new Vector3(18, 2, -4),
  new Vector3(9, 0.5, -13),
  new Vector3(2, 0, -7),
  new Vector3(0, 0, -2.5),
  new Vector3(-1.5, 0.4, 1.5),
  new Vector3(-0.5, -0.3, 5),
  new Vector3(2, 0.5, 9),
  new Vector3(0, 1, 13),
]

export const cameraPath = new CatmullRomCurve3(CAMERA_PATH_POINTS, false, 'catmullrom', 0.5)

/** Path progress values where the camera is inside the nebula — project panels live here. */
export const PROJECT_PATH_STOPS = [0.74, 0.79, 0.84, 0.89]
