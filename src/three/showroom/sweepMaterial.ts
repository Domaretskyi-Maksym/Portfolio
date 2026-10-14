import gsap from 'gsap'
import { Color, MeshPhysicalMaterial, Vector2, type MeshPhysicalMaterialParameters } from 'three'

/** World-space height band the sweep travels across (models are normalized to a unit sphere). */
const SWEEP_RANGE = new Vector2(-1.15, 1.15)
const SWEEP_SECONDS = 1.1

interface SweepState {
  color: { value: Color }
  progress: { value: number }
  range: { value: Vector2 }
  tween?: gsap.core.Tween
  target: Color
}

const VERTEX_HEAD = /* glsl */ `
varying vec3 vSweepWorld;
`
const VERTEX_BODY = /* glsl */ `
#include <begin_vertex>
vSweepWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
`
const FRAGMENT_HEAD = /* glsl */ `
uniform vec3 uSweepColor;
uniform float uSweepProgress;
uniform vec2 uSweepRange;
varying vec3 vSweepWorld;

float sweepHeight() {
  float h = (vSweepWorld.y - uSweepRange.x) / (uSweepRange.y - uSweepRange.x);
  return h + sin(vSweepWorld.x * 7.0 + vSweepWorld.z * 5.0) * 0.018;
}
float sweepEdge() {
  return mix(-0.08, 1.08, uSweepProgress);
}
`
const FRAGMENT_COLOR = /* glsl */ `
#include <color_fragment>
float sweepMask = 1.0 - smoothstep(sweepEdge() - 0.035, sweepEdge() + 0.035, sweepHeight());
diffuseColor.rgb = mix(diffuseColor.rgb, uSweepColor, sweepMask * step(0.0001, uSweepProgress));
`
const FRAGMENT_EMISSIVE = /* glsl */ `
#include <emissivemap_fragment>
float sweepActive = step(0.0001, uSweepProgress) * step(uSweepProgress, 0.9999);
float sweepSeam = exp(-pow((sweepHeight() - sweepEdge()) / 0.02, 2.0));
totalEmissiveRadiance += (uSweepColor + vec3(0.35)) * sweepSeam * sweepActive * 2.2;
`

const states = new WeakMap<MeshPhysicalMaterial, SweepState>()

/**
 * Physical material whose color can "flow" into a new one: the new color fills the model
 * from bottom to top behind a glowing seam, instead of snapping.
 */
export function createSweepMaterial(parameters: MeshPhysicalMaterialParameters): MeshPhysicalMaterial {
  const material = new MeshPhysicalMaterial(parameters)
  const state: SweepState = {
    color: { value: material.color.clone() },
    progress: { value: 0 },
    range: { value: SWEEP_RANGE },
    target: material.color.clone(),
  }
  states.set(material, state)

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSweepColor = state.color
    shader.uniforms.uSweepProgress = state.progress
    shader.uniforms.uSweepRange = state.range
    shader.vertexShader = VERTEX_HEAD + shader.vertexShader.replace('#include <begin_vertex>', VERTEX_BODY)
    shader.fragmentShader =
      FRAGMENT_HEAD +
      shader.fragmentShader
        .replace('#include <color_fragment>', FRAGMENT_COLOR)
        .replace('#include <emissivemap_fragment>', FRAGMENT_EMISSIVE)
  }
  material.customProgramCacheKey = () => 'showroom-sweep'
  return material
}

/** Recolors `material`; with `animate` the change sweeps across the model. */
export function sweepTo(material: MeshPhysicalMaterial, color: string, animate: boolean) {
  const state = states.get(material)
  if (!state) {
    material.color.set(color)
    return
  }

  state.tween?.kill()
  material.color.copy(state.target)
  state.target.set(color)
  state.progress.value = 0

  if (!animate || material.color.equals(state.target)) {
    material.color.copy(state.target)
    return
  }

  state.color.value.copy(state.target)
  state.tween = gsap.to(state.progress, {
    value: 1,
    duration: SWEEP_SECONDS,
    ease: 'power2.inOut',
    onComplete: () => {
      material.color.copy(state.target)
      state.progress.value = 0
    },
  })
}

export function disposeSweepMaterial(material: MeshPhysicalMaterial) {
  states.get(material)?.tween?.kill()
  states.delete(material)
  material.dispose()
}
