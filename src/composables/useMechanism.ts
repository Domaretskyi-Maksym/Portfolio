import { useLoop } from '@tresjs/core'
import gsap from 'gsap'
import { MathUtils } from 'three'
import { inject, onUnmounted, provide, type InjectionKey } from 'vue'

/** Master shaft speed at 1× (rad/s). */
const BASE_ANGULAR_SPEED = 0.6
const HOVER_SPEED_MULTIPLIER = 3.5
/** How quickly (1/s) the speed multiplier chases its target. */
const SPEED_RESPONSE = 2.5
const MAX_FRAME_DELTA = 0.1

export interface MechanismState {
  /** Master shaft angle (radians); every part derives its motion from it. */
  angle: number
  /** Current speed multiplier, eased towards 1× or the hover boost. */
  speed: number
  /** Number of gears under the pointer — any hover spins the machine up. */
  hoveredGears: number
  /** 0 = assembled, 1 = fully exploded. Animated by GSAP. */
  explode: number
  isExploded: boolean
}

export interface Mechanism {
  state: MechanismState
  toggleExplode: () => void
}

const MECHANISM_KEY: InjectionKey<Mechanism> = Symbol('kinetic-mechanism')

/** Owns the machine's clock. Must be called inside a TresCanvas subtree. */
export function provideMechanism(): Mechanism {
  // Plain object on purpose: it is read and written every frame.
  const state: MechanismState = { angle: 0, speed: 1, hoveredGears: 0, explode: 0, isExploded: false }

  const { onBeforeRender } = useLoop()
  onBeforeRender(({ delta }) => {
    const dt = Math.min(delta, MAX_FRAME_DELTA)
    const targetSpeed = state.hoveredGears > 0 ? HOVER_SPEED_MULTIPLIER : 1
    state.speed = MathUtils.lerp(state.speed, targetSpeed, 1 - Math.exp(-SPEED_RESPONSE * dt))
    // Integrate instead of deriving from elapsed time, so speed changes never make parts jump.
    state.angle += BASE_ANGULAR_SPEED * state.speed * dt
  })

  const toggleExplode = () => {
    state.isExploded = !state.isExploded
    gsap.to(state, {
      explode: state.isExploded ? 1 : 0,
      duration: state.isExploded ? 1.4 : 1.1,
      ease: state.isExploded ? 'power3.out' : 'power3.inOut',
      overwrite: true,
    })
  }

  onUnmounted(() => gsap.killTweensOf(state))

  const mechanism = { state, toggleExplode }
  provide(MECHANISM_KEY, mechanism)
  return mechanism
}

export function useMechanism() {
  const mechanism = inject(MECHANISM_KEY)
  if (!mechanism) throw new Error('useMechanism() must be used below provideMechanism()')
  return mechanism
}
