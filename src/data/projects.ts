export interface Project {
  id: string
  title: string
  tag: string
  description: string
  accent: string
}

export const projects: Project[] = [
  {
    id: 'alpha',
    title: 'Project Alpha',
    tag: 'WebGL · Vue',
    description: 'Інтерактивна 3D-візуалізація даних у реальному часі.',
    accent: '#60a5fa',
  },
  {
    id: 'beta',
    title: 'Project Beta',
    tag: 'TypeScript · Node',
    description: 'Платформа з realtime-синхронізацією та офлайн-режимом.',
    accent: '#a78bfa',
  },
  {
    id: 'gamma',
    title: 'Project Gamma',
    tag: 'Design System',
    description: 'Компонентна бібліотека з токенами та темами.',
    accent: '#f472b6',
  },
  {
    id: 'delta',
    title: 'Project Delta',
    tag: 'GLSL · Shaders',
    description: 'Генеративне мистецтво на кастомних шейдерах.',
    accent: '#22d3ee',
  },
]
