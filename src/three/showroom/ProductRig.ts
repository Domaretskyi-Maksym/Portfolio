import {
  Box3,
  DoubleSide,
  FrontSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Sphere,
  Vector3,
  type BufferGeometry,
  type Material,
  type MeshPhysicalMaterial,
  type MeshPhysicalMaterialParameters,
  type Texture,
} from 'three'
import type { Colorway, MaterialSlot, Product } from '../../data/products'
import type { ProductView } from './viewRegistry'
import { createSweepMaterial, disposeSweepMaterial, sweepTo } from './sweepMaterial'
import type { ModelSpec } from './types'

const SLOT_PARAMETERS: Record<MaterialSlot, MeshPhysicalMaterialParameters> = {
  primary: { roughness: 0.42, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.3 },
  secondary: { roughness: 0.74, metalness: 0, sheen: 0.5, sheenRoughness: 0.8 },
  accent: { roughness: 0.28, metalness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15 },
  metal: { roughness: 0.2, metalness: 1 },
  soft: { roughness: 0.95, metalness: 0, sheen: 1, sheenRoughness: 0.5 },
  glass: {
    roughness: 0.02,
    metalness: 0,
    transparent: true,
    opacity: 0.1,
    ior: 1.5,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2.6,
    depthWrite: false,
    side: FrontSide,
  },
}

const SLOT_FALLBACK_COLORS: Record<MaterialSlot, string> = {
  primary: '#77797f',
  secondary: '#e5e5e7',
  accent: '#8a8f99',
  metal: '#c9ccd2',
  soft: '#2a2a2e',
  glass: '#eef4ff',
}

/** Damping rates (1/s) for the different motions. */
const RATE = { presenceIn: 5, presenceOut: 10, rotation: 6, glow: 6, explode: 3.2, morph: 9, lift: 7 }
const CARD_TILT = { yaw: 0.55, pitch: 0.32 }
const HERO_TILT = { yaw: 0.18, pitch: 0.12 }
const HERO_AUTO_SPIN = 0.16
const FLIGHT_SPIN = 7
const SPIN_FRICTION = 2.5
const HOVER_LIFT = 0.07
const EXPLODE_STAGGER = 0.45
const EXPLODE_FRAME_GROWTH = 0.55
const PARCEL_SCALE = 0.6

export interface RigSharedAssets {
  shadowTexture: Texture
  parcelGeometry: BufferGeometry
  parcelMaterial: Material
  tapeGeometry: BufferGeometry
  tapeMaterial: Material
}

interface RigPart {
  object: Object3D
  base: Vector3
  offset: Vector3
}

const shadowGeometry = new PlaneGeometry(1, 1)

function wrapAngle(angle: number) {
  return MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function easeOutBack(t: number) {
  const c = 1.6
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2
}

/**
 * One product's 3D model, normalized to a unit sphere around the origin. It is shown in at most
 * one view per frame and reacts to that view's mode and pointer; colorway, exploded state and
 * the parcel morph persist across views so hand-offs (grid → page → cart) stay continuous.
 */
export class ProductRig {
  readonly root = new Group()
  /** Bounding radius the camera should frame, grows while the model is exploded. */
  frameRadius = 1

  private readonly content = new Group()
  private readonly model = new Group()
  private readonly parcel = new Group()
  private readonly shadow: Mesh<PlaneGeometry, MeshBasicMaterial>
  private readonly parts: RigPart[] = []
  private readonly partsById: Record<string, Object3D> = {}
  private readonly materials = new Map<MaterialSlot, MeshPhysicalMaterial>()
  private readonly modelScale: number

  private yaw: number
  private pitch = 0
  private lift = 0
  private explode = 0
  private morph = 0

  readonly product: Product
  private readonly spec: ModelSpec

  constructor(product: Product, spec: ModelSpec, shared: RigSharedAssets) {
    this.product = product
    this.spec = spec
    this.yaw = product.restYaw
    this.root.visible = false

    const assembly = new Group()
    if (spec.rotation) assembly.rotation.set(...spec.rotation)
    for (const part of spec.parts) {
      const mesh = new Mesh(part.geometry, this.materialFor(part.slot))
      if (part.position) mesh.position.set(...part.position)
      if (part.rotation) mesh.rotation.set(...part.rotation)
      assembly.add(mesh)
      this.parts.push({ object: mesh, base: mesh.position.clone(), offset: new Vector3(...part.explode) })
      if (part.id) this.partsById[part.id] = mesh
    }
    this.model.add(assembly)

    assembly.updateMatrixWorld(true)
    const bounds = new Box3().setFromObject(assembly)
    const sphere = bounds.getBoundingSphere(new Sphere())
    this.modelScale = 1 / sphere.radius
    assembly.position.copy(sphere.center).multiplyScalar(-1)
    const bottom = (bounds.min.y - sphere.center.y) * this.modelScale

    const box = new Mesh(shared.parcelGeometry, shared.parcelMaterial)
    const tape = new Mesh(shared.tapeGeometry, shared.tapeMaterial)
    this.parcel.add(box, tape)
    this.parcel.scale.setScalar(0)

    this.content.add(this.model, this.parcel)
    this.shadow = new Mesh(
      shadowGeometry,
      new MeshBasicMaterial({ map: shared.shadowTexture, transparent: true, depthWrite: false, opacity: 0.5, side: DoubleSide }),
    )
    this.shadow.rotation.x = -Math.PI / 2
    this.shadow.position.y = Math.max(bottom, -1) - 0.04
    this.shadow.scale.setScalar(1.9)
    this.shadow.renderOrder = -1
    this.root.add(this.content, this.shadow)

    this.setColorway(product.colorways[0], false)
  }

  setColorway(colorway: Colorway, animate: boolean) {
    this.materials.forEach((material, slot) => {
      sweepTo(material, colorway.slots[slot] ?? SLOT_FALLBACK_COLORS[slot], animate)
    })
  }

  /** Advances the rig for the view it is rendered in this frame. */
  update(dt: number, view: ProductView, exploded: boolean) {
    this.updatePresence(dt, view)
    view.glow = MathUtils.damp(view.glow, view.hovered ? 1 : view.mode === 'hero' ? 0.3 : 0, RATE.glow, dt)

    let yawTarget = this.product.restYaw
    let pitchTarget = 0
    let liftTarget = 0
    if (view.mode === 'card') {
      if (view.hovered) {
        yawTarget += view.pointer.x * CARD_TILT.yaw
        pitchTarget = -view.pointer.y * CARD_TILT.pitch
        liftTarget = HOVER_LIFT
      }
    } else if (view.mode === 'hero') {
      if (!view.dragging) {
        view.dragYaw += (view.spinVelocity + (view.hovered ? 0 : HERO_AUTO_SPIN)) * dt
        view.spinVelocity = MathUtils.damp(view.spinVelocity, 0, SPIN_FRICTION, dt)
      }
      yawTarget += view.dragYaw + view.pointer.x * HERO_TILT.yaw
      pitchTarget = -view.pointer.y * HERO_TILT.pitch
    } else {
      view.dragYaw += FLIGHT_SPIN * dt
      yawTarget += view.dragYaw
    }

    const rotationAlpha = 1 - Math.exp(-RATE.rotation * dt)
    this.yaw += wrapAngle(yawTarget - this.yaw) * rotationAlpha
    this.pitch += (pitchTarget - this.pitch) * rotationAlpha
    this.lift = MathUtils.damp(this.lift, liftTarget, RATE.lift, dt)
    this.explode = MathUtils.damp(this.explode, exploded && view.mode === 'hero' ? 1 : 0, RATE.explode, dt)
    this.morph = MathUtils.damp(this.morph, view.mode === 'flight' ? 1 : 0, RATE.morph, dt)

    this.applyPose()
    this.spec.animate?.(this.partsById, performance.now() / 1000)
  }

  dispose() {
    this.materials.forEach(disposeSweepMaterial)
    this.shadow.material.dispose()
  }

  private materialFor(slot: MaterialSlot) {
    let material = this.materials.get(slot)
    if (!material) {
      material = createSweepMaterial({ ...SLOT_PARAMETERS[slot], ...this.spec.slotOverrides?.[slot] })
      this.materials.set(slot, material)
    }
    return material
  }

  private updatePresence(dt: number, view: ProductView) {
    if (view.delay > 0) {
      view.delay -= dt
      return
    }
    const rate = view.presenceTarget > view.presence ? RATE.presenceIn : RATE.presenceOut
    view.presence = MathUtils.damp(view.presence, view.presenceTarget, rate, dt)
  }

  private applyPose() {
    const count = this.parts.length
    const stagger = EXPLODE_STAGGER / count
    this.parts.forEach((part, index) => {
      const t = easeInOut(MathUtils.clamp(this.explode * (1 + stagger * (count - 1)) - stagger * index, 0, 1))
      part.object.position.copy(part.base).addScaledVector(part.offset, t)
    })
    this.frameRadius = 1 + this.explode * EXPLODE_FRAME_GROWTH

    this.content.rotation.set(this.pitch, this.yaw, 0)
    this.content.position.y = this.lift
    const morph = easeInOut(MathUtils.clamp(this.morph, 0, 1))
    this.model.scale.setScalar(this.modelScale * Math.max(1 - morph, 1e-4))
    this.parcel.scale.setScalar(PARCEL_SCALE * Math.max(easeOutBack(morph), 1e-4))
  }

  /** Root scale/shadow depend on the view's presence, applied right before it renders. */
  prepareForView(view: ProductView) {
    const presence = MathUtils.clamp(view.presence, 0, 1)
    this.root.scale.setScalar(Math.max(presence * (1 + this.lift * 0.5), 1e-4))
    this.shadow.material.opacity = 0.5 * presence * (1 - this.morph) * (1 - this.lift * 4)
  }
}
