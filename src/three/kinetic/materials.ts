import { Color, MeshPhysicalMaterial, type Texture } from 'three'
import { createBrushedRoughnessTexture } from './textures'

export const BAUHAUS = {
  red: '#d62828',
  yellow: '#f7b801',
  blue: '#1d4ed8',
  graphite: '#2b2d33',
} as const

export type AccentName = keyof typeof BAUHAUS

export interface KineticMaterials {
  brushedSteel: MeshPhysicalMaterial
  /** Gunmetal for axles, nuts and bolts — keeps the steel parts from reading as one flat grey. */
  darkSteel: MeshPhysicalMaterial
  plastic: Record<AccentName, MeshPhysicalMaterial>
  frostedGlass: MeshPhysicalMaterial
  /** Polished glass with dispersion — the colour fringing of real optical glass. */
  clearGlass: MeshPhysicalMaterial
}

interface KineticMaterialLibrary extends KineticMaterials {
  textures: Texture[]
}

/** Powder-coated finish: matte base with a thin satin clearcoat that catches the environment. */
function createPlastic(color: string, brushed: Texture) {
  return new MeshPhysicalMaterial({
    color,
    metalness: 0,
    roughness: 0.62,
    clearcoat: 0.35,
    clearcoatRoughness: 0.32,
    clearcoatRoughnessMap: brushed,
    envMapIntensity: 1.1,
  })
}

export function createKineticMaterials(): KineticMaterialLibrary {
  const brushed = createBrushedRoughnessTexture()

  return {
    textures: [brushed],
    brushedSteel: new MeshPhysicalMaterial({
      color: '#e0e0e0',
      metalness: 0.8,
      roughness: 0.3,
      roughnessMap: brushed,
      anisotropy: 0.75,
      envMapIntensity: 1.4,
    }),
    darkSteel: new MeshPhysicalMaterial({
      color: '#6b6f77',
      metalness: 1,
      roughness: 0.26,
      roughnessMap: brushed,
      anisotropy: 0.5,
      envMapIntensity: 1.5,
    }),
    plastic: {
      red: createPlastic(BAUHAUS.red, brushed),
      yellow: createPlastic(BAUHAUS.yellow, brushed),
      blue: createPlastic(BAUHAUS.blue, brushed),
      graphite: createPlastic(BAUHAUS.graphite, brushed),
    },
    frostedGlass: new MeshPhysicalMaterial({
      color: '#ffffff',
      metalness: 0,
      roughness: 0.2,
      transmission: 1,
      thickness: 0.5,
      ior: 1.5,
      envMapIntensity: 1.3,
    }),
    clearGlass: new MeshPhysicalMaterial({
      color: '#eef3fb',
      metalness: 0,
      roughness: 0.06,
      transmission: 1,
      thickness: 0.4,
      ior: 1.5,
      dispersion: 4,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.6,
    }),
  }
}

export function disposeKineticMaterials(materials: KineticMaterialLibrary) {
  materials.brushedSteel.dispose()
  materials.darkSteel.dispose()
  materials.frostedGlass.dispose()
  materials.clearGlass.dispose()
  Object.values(materials.plastic).forEach((material) => material.dispose())
  materials.textures.forEach((texture) => texture.dispose())
}

/** Per-instance copy so hover glow on one part does not light up every part sharing the material. */
export function cloneWithEmissive(material: MeshPhysicalMaterial, emissive: string) {
  const clone = material.clone()
  clone.emissive = new Color(emissive)
  clone.emissiveIntensity = 0
  return clone
}

/** Anodised metal with an engraved, back-lit label — used for the skill blocks. */
export function createEngravedMetal(color: string, bump: Texture, glow: Texture, glowColor: string) {
  return new MeshPhysicalMaterial({
    color,
    metalness: 0.85,
    roughness: 0.34,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    bumpMap: bump,
    bumpScale: 3,
    emissive: new Color(glowColor),
    emissiveMap: glow,
    emissiveIntensity: 2.4,
    envMapIntensity: 1.4,
  })
}
