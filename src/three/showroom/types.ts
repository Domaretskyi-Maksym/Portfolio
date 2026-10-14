import type { BufferGeometry, MeshPhysicalMaterialParameters, Object3D } from 'three'
import type { MaterialSlot } from '../../data/products'

export type Vec3 = [number, number, number]

export interface ModelPart {
  geometry: BufferGeometry
  slot: MaterialSlot
  position?: Vec3
  rotation?: Vec3
  /** Offset (model units) the part travels to in the fully exploded view. */
  explode: Vec3
  /** Lets `animate` find moving details such as watch hands. */
  id?: string
}

export interface ModelSpec {
  parts: ModelPart[]
  /** Orientation of the assembled product inside its rig (e.g. a keyboard tilted toward the viewer). */
  rotation?: Vec3
  slotOverrides?: Partial<Record<MaterialSlot, MeshPhysicalMaterialParameters>>
  /** Per-frame hook for moving details, keyed by part `id`. */
  animate?: (parts: Record<string, Object3D>, time: number) => void
}
