import { useLoop } from '@tresjs/core'
import { MathUtils, type MeshPhysicalMaterial } from 'three'
import { onUnmounted } from 'vue'

interface HoverGlowOptions {
  intensity?: number
  /** Damping rate (1/s) of the emissive transition. */
  response?: number
  cursor?: string
  onChange?: (hovered: boolean) => void
}

/** Eases a material's emissive glow while its mesh is under the pointer. */
export function useHoverGlow(material: MeshPhysicalMaterial, options: HoverGlowOptions = {}) {
  const { intensity = 0.45, response = 10, cursor = 'pointer', onChange } = options
  let hovered = false

  const setHovered = (value: boolean) => {
    if (hovered === value) return
    hovered = value
    document.body.style.cursor = value ? cursor : ''
    onChange?.(value)
  }

  const { onBeforeRender } = useLoop()
  onBeforeRender(({ delta }) => {
    material.emissiveIntensity = MathUtils.damp(material.emissiveIntensity, hovered ? intensity : 0, response, delta)
  })

  onUnmounted(() => setHovered(false))

  return {
    isHovered: () => hovered,
    onPointerOver: () => setHovered(true),
    onPointerOut: () => setHovered(false),
  }
}
