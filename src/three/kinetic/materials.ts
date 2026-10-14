import { Color, MeshPhysicalMaterial } from 'three'

export const BAUHAUS = {
  red: '#d62828',
  yellow: '#f7b801',
  blue: '#1d4ed8',
  graphite: '#2b2d33',
} as const

export type AccentName = keyof typeof BAUHAUS

export interface KineticMaterials {
  brushedSteel: MeshPhysicalMaterial
  plastic: Record<AccentName, MeshPhysicalMaterial>
  frostedGlass: MeshPhysicalMaterial
}

function createPlastic(color: string) {
  return new MeshPhysicalMaterial({
    color,
    metalness: 0,
    roughness: 0.8,
    clearcoat: 0.1,
    clearcoatRoughness: 0.5,
  })
}

export function createKineticMaterials(): KineticMaterials {
  return {
    brushedSteel: new MeshPhysicalMaterial({
      color: '#e0e0e0',
      metalness: 0.8,
      roughness: 0.3,
      anisotropy: 0.6,
    }),
    plastic: {
      red: createPlastic(BAUHAUS.red),
      yellow: createPlastic(BAUHAUS.yellow),
      blue: createPlastic(BAUHAUS.blue),
      graphite: createPlastic(BAUHAUS.graphite),
    },
    frostedGlass: new MeshPhysicalMaterial({
      color: '#ffffff',
      metalness: 0,
      roughness: 0.2,
      transmission: 1,
      thickness: 0.5,
      ior: 1.5,
    }),
  }
}

export function disposeKineticMaterials(materials: KineticMaterials) {
  materials.brushedSteel.dispose()
  materials.frostedGlass.dispose()
  Object.values(materials.plastic).forEach((material) => material.dispose())
}

/** Per-instance copy so hover glow on one part does not light up every part sharing the material. */
export function cloneWithEmissive(material: MeshPhysicalMaterial, emissive: string) {
  const clone = material.clone()
  clone.emissive = new Color(emissive)
  clone.emissiveIntensity = 0
  return clone
}
