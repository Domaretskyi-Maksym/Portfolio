import { inject, onUnmounted, provide, type InjectionKey } from 'vue'
import { createKineticMaterials, disposeKineticMaterials, type KineticMaterials } from '../three/kinetic/materials'

const KINETIC_MATERIALS_KEY: InjectionKey<KineticMaterials> = Symbol('kinetic-materials')

/** Creates the shared PBR material library for a subtree and disposes it with the provider. */
export function provideKineticMaterials() {
  const materials = createKineticMaterials()
  provide(KINETIC_MATERIALS_KEY, materials)
  onUnmounted(() => disposeKineticMaterials(materials))
  return materials
}

export function useKineticMaterials() {
  const materials = inject(KINETIC_MATERIALS_KEY)
  if (!materials) throw new Error('useKineticMaterials() must be used below provideKineticMaterials()')
  return materials
}
