import { init } from '@dimforge/rapier3d-compat'

let ready: Promise<void> | undefined

/**
 * Initializes the Rapier WASM module exactly once. `RAPIER.init()` only guards against repeat
 * calls after it resolves, so concurrent `<Physics>` mounts would each instantiate their own
 * module and corrupt the memory the first world points into. Await this before mounting any
 * `<Physics>` so their internal `init()` becomes a no-op.
 */
export function ensureRapier(): Promise<void> {
  ready ??= init()
  return ready
}
