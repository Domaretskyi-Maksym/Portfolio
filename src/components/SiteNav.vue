<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

export interface NavSection {
  hash: string
  label: string
}

defineProps<{
  brand: string
  sections: readonly NavSection[]
  alternate?: { to: RouteLocationRaw; label: string }
}>()

function scrollTo(hash: string) {
  document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <header class="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
    <nav class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4" aria-label="Головна навігація">
      <button type="button" class="text-sm font-semibold tracking-wide text-white transition hover:text-zinc-300" @click="scrollToTop">
        {{ brand }}
      </button>

      <ul class="flex items-center gap-1 sm:gap-2">
        <li v-for="section in sections" :key="section.hash">
          <button
            type="button"
            class="rounded-full px-3 py-2 text-sm font-medium text-zinc-400 transition hover:text-white sm:px-4"
            @click="scrollTo(section.hash)"
          >
            {{ section.label }}
          </button>
        </li>
        <li v-if="alternate">
          <RouterLink
            :to="alternate.to"
            class="ml-1 rounded-full border border-white/15 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/40 hover:text-white"
          >
            {{ alternate.label }}
          </RouterLink>
        </li>
      </ul>
    </nav>
  </header>
</template>
