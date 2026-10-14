import type { ModelType } from '../../../data/products'
import type { ModelSpec } from '../types'
import { buildHeadphones } from './headphones'
import { buildKeyboard } from './keyboard'
import { buildPerfume } from './perfume'
import { buildWatch } from './watch'

const BUILDERS: Record<ModelType, () => ModelSpec> = {
  headphones: buildHeadphones,
  watch: buildWatch,
  perfume: buildPerfume,
  keyboard: buildKeyboard,
}

/** Specs are built once per model type; products of the same type share the geometry. */
const cache = new Map<ModelType, ModelSpec>()

export function getModelSpec(type: ModelType): ModelSpec {
  let spec = cache.get(type)
  if (!spec) {
    spec = BUILDERS[type]()
    cache.set(type, spec)
  }
  return spec
}

export function disposeModelSpecs() {
  const geometries = new Set([...cache.values()].flatMap((spec) => spec.parts.map((part) => part.geometry)))
  geometries.forEach((geometry) => geometry.dispose())
  cache.clear()
}
