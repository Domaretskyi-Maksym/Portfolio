<script setup lang="ts">
import SiteNav, { type NavSection } from '../components/SiteNav.vue'
import KineticScene from '../components/kinetic/KineticScene.vue'

const SECTIONS: NavSection[] = [
  { hash: '#core', label: 'Про мене' },
  { hash: '#skills', label: 'Навички' },
  { hash: '#projects', label: 'Проєкти' },
]
</script>

<template>
  <div class="relative bg-[#1d1e22]">
    <SiteNav brand="Kinetic Machine" :sections="SECTIONS" :alternate="{ to: '/shop', label: 'Showroom' }" />

    <div class="fixed inset-0 z-0">
      <KineticScene />
    </div>

    <!-- Each section maps to one camera node; scroll progress interpolates between them. -->
    <main class="pointer-events-none relative z-10">
      <section id="core" class="flex h-[160vh] items-start px-6 pt-[22vh]">
        <div class="ml-auto max-w-md">
          <div class="flex gap-1.5">
            <span class="h-2 w-10 bg-[#d62828]" />
            <span class="h-2 w-6 bg-[#f7b801]" />
            <span class="h-2 w-3 bg-[#1d4ed8]" />
          </div>
          <p class="mt-6 text-xs font-semibold tracking-[0.4em] text-zinc-400 uppercase">01 · Core</p>
          <h1 class="mt-3 text-5xl font-bold tracking-tight text-white sm:text-6xl">Твоє Імʼя</h1>
          <p class="mt-5 text-lg leading-relaxed text-zinc-300">
            Creative developer. Збираю інтерфейси як механізми — точно, чесно, без зайвих деталей.
          </p>
          <ul class="mt-8 space-y-2 text-sm text-zinc-400">
            <li><span class="font-semibold text-[#f7b801]">Наведи</span> на шестерню — механізм розженеться.</li>
            <li><span class="font-semibold text-[#f7b801]">Клікни</span> жовтий хаб — машина розбереться на деталі.</li>
          </ul>
          <p class="mt-12 text-xs tracking-[0.3em] text-zinc-500 uppercase">Scroll ↓</p>
        </div>
      </section>

      <section id="skills" class="flex h-[160vh] items-center px-6">
        <div class="mr-auto max-w-sm rounded-2xl border border-white/10 bg-black/30 p-7 backdrop-blur-md">
          <p class="text-xs font-semibold tracking-[0.4em] text-[#f7b801] uppercase">02 · Conveyor</p>
          <h2 class="mt-3 text-3xl font-bold text-white">Навички</h2>
          <p class="mt-4 leading-relaxed text-zinc-300">
            Інструменти, що щодня проходять через мій конвеєр: Vue, TypeScript, Three.js, GSAP, GLSL, Node.
          </p>
          <p class="mt-4 text-sm text-zinc-400">
            <span class="font-semibold text-[#f7b801]">Хапай</span> блок мишкою — підкинь або скинь зі стрічки, система
            видасть новий.
          </p>
        </div>
      </section>

      <section id="projects" class="flex h-[160vh] items-end px-6 pb-[24vh]">
        <div class="ml-auto max-w-sm rounded-2xl border border-white/10 bg-black/30 p-7 backdrop-blur-md">
          <p class="text-xs font-semibold tracking-[0.4em] text-[#d62828] uppercase">03 · Screens</p>
          <h2 class="mt-3 text-3xl font-bold text-white">Проєкти</h2>
          <p class="mt-4 leading-relaxed text-zinc-300">
            Карусель скляних екранів. Наведи — ротор зупиниться; зажми клік і тягни вліво/вправо, щоб крутити самому.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>
