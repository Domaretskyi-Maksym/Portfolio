export type Vec3 = [number, number, number]

/** How a kinematic part moves around the world Z axis, driven by the mechanism's master angle. */
export type PartMotion =
  | { kind: 'spin'; ratio: number; phase: number }
  | { kind: 'swing'; amplitude: number; frequency: number; phase?: number }

export function motionAngle(motion: PartMotion, masterAngle: number) {
  return motion.kind === 'spin'
    ? motion.ratio * masterAngle + motion.phase
    : motion.amplitude * Math.sin(masterAngle * motion.frequency + (motion.phase ?? 0))
}
