import { onBeforeUnmount, ref } from 'vue'

interface SpringOptions {
  stiffness?: number
  damping?: number
}

const REST_EPSILON = 0.001

/**
 * Damped harmonic oscillator around 0 (semi-implicit Euler). `impulse` kicks its velocity;
 * the rAF loop only runs until the spring settles.
 */
export function useSpring({ stiffness = 380, damping = 11 }: SpringOptions = {}) {
  const value = ref(0)
  let velocity = 0
  let frame = 0
  let lastTime = 0

  function step(time: number) {
    const dt = Math.min((time - lastTime) / 1000, 1 / 30)
    lastTime = time
    velocity += (-stiffness * value.value - damping * velocity) * dt
    value.value += velocity * dt
    if (Math.abs(value.value) < REST_EPSILON && Math.abs(velocity) < REST_EPSILON) {
      value.value = 0
      velocity = 0
      frame = 0
      return
    }
    frame = requestAnimationFrame(step)
  }

  function impulse(amount: number) {
    velocity += amount
    if (!frame) {
      lastTime = performance.now()
      frame = requestAnimationFrame(step)
    }
  }

  onBeforeUnmount(() => cancelAnimationFrame(frame))

  return { value, impulse }
}
