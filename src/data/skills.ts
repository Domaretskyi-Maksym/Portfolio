import type { AccentName } from '../three/kinetic/materials'

export interface Skill {
  id: string
  label: string
  finish: AccentName | 'steel'
}

export const skills: Skill[] = [
  { id: 'vue', label: 'Vue', finish: 'blue' },
  { id: 'typescript', label: 'TS', finish: 'yellow' },
  { id: 'three', label: 'Three', finish: 'red' },
  { id: 'gsap', label: 'GSAP', finish: 'steel' },
  { id: 'glsl', label: 'GLSL', finish: 'blue' },
  { id: 'node', label: 'Node', finish: 'graphite' },
]
