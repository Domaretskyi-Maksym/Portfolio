/**
 * Per-frame values shared between the DOM layer and the nebula scene.
 * Plain (non-reactive) objects on purpose: they are read every frame.
 */
export const scrollState = {
  progress: 0,
}

export const signalState = {
  burst: 0,
}
