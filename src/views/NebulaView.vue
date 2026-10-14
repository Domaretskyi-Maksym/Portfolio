<script setup lang="ts">
import gsap from 'gsap'
import SiteNav, { type NavSection } from '../components/SiteNav.vue'
import NebulaScene from '../components/nebula/NebulaScene.vue'
import { signalState } from '../three/nebula/state'

const SECTIONS: NavSection[] = [
  { hash: '#orbit', label: 'Orbit' },
  { hash: '#core', label: 'Core' },
  { hash: '#projects', label: 'Projects' },
  { hash: '#signal', label: 'Signal' },
]

function sendSignal() {
  gsap.fromTo(signalState, { burst: 1 }, { burst: 0, duration: 1.6, ease: 'power3.out', overwrite: true })
}
</script>

<template>
  <div class="relative">
    <SiteNav brand="Living Nebula" :sections="SECTIONS" :alternate="{ to: '/', label: 'Kinetic Machine' }" />
    <div class="fixed inset-0 z-0">
      <NebulaScene />
    </div>

    <!-- Section heights pace the scroll against the camera path (orbit → dive → projects → signal). -->
    <main class="pointer-events-none relative z-10">
      <section id="orbit" class="h-[330vh]">
        <div class="flex h-screen flex-col items-center justify-center px-6 text-center">
          <p class="text-xs font-medium tracking-[0.4em] text-violet-300/90 uppercase">Living Nebula</p>
          <h1 class="mt-5 text-5xl font-semibold tracking-tight text-white sm:text-7xl">Твоє Імʼя</h1>
          <p class="mt-6 max-w-xl text-lg text-zinc-300/90">
            Creative developer. Будую інтерфейси, що дихають.
          </p>
          <p class="mt-12 text-xs tracking-[0.3em] text-zinc-500 uppercase">Scroll to descend</p>
        </div>
      </section>

      <section id="core" class="flex h-[120vh] items-center px-6">
        <div class="mx-auto max-w-xl rounded-3xl border border-white/10 bg-black/25 p-8 backdrop-blur-md">
          <p class="text-xs tracking-[0.3em] text-teal-300/90 uppercase">The Core</p>
          <h2 class="mt-3 text-3xl font-semibold text-white">Про мене</h2>
          <p class="mt-4 leading-relaxed text-zinc-300">
            Камера пірнає в серце туманності. Тут буде твоя історія, досвід і стек.
          </p>
        </div>
      </section>

      <section id="projects" class="h-[150vh] px-6 pt-24">
        <p class="sticky top-24 text-center text-xs tracking-[0.3em] text-indigo-300/90 uppercase">
          Constellations · наведи на панель
        </p>
      </section>

      <section id="signal" class="flex h-screen items-center justify-center px-6">
        <div class="max-w-md text-center">
          <p class="text-xs tracking-[0.3em] text-rose-300/90 uppercase">The Pulse</p>
          <h2 class="mt-3 text-3xl font-semibold text-white">Сигнал у космос</h2>
          <p class="mt-4 text-zinc-400">Напиши мені — і туманність відповість хвилею.</p>
          <button
            type="button"
            class="pointer-events-auto mt-8 rounded-full bg-linear-to-r from-violet-500 to-rose-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:scale-[1.03]"
            @click="sendSignal"
          >
            Надіслати сигнал
          </button>
        </div>
      </section>
    </main>
  </div>
</template>
