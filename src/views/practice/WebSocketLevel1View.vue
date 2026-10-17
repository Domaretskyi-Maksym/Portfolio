<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

let ws: WebSocket | null = null
let messages = ref<string[]>([]);
const draft = ref("");
const status = ref<'connecting' | 'open' | 'closed' | 'error'>('connecting');

  onMounted(() => {
    status.value = "connecting"
    ws = new WebSocket('ws://localhost:8080');
    ws.onmessage = (event) => {
      try {
        let { text } = JSON.parse(event.data);
        messages.value = [...messages.value, text];
      } catch {
        messages.value = [...messages.value, String(event.data)];
      }
    }

    ws.onopen = () => status.value = 'open';
    ws.onclose = () => status.value = 'closed'
    ws.onerror = () => status.value = "error";
  });

  onUnmounted(() => {
    ws?.close();
    ws = null;
  })

 function sendMessage() {
  const text = draft.value.trim();

  if (!text) return;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("Ще не підключено");
    return;
  };
  ws?.send(text);
  draft.value = "";

 }
</script>

<template>
  <div class="min-h-screen bg-[#02030a] text-zinc-100">
    <header class="border-b border-white/10 px-6 py-4">
      <div class="mx-auto flex max-w-2xl items-center justify-between gap-4">
        <div>
          <p class="text-xs font-semibold tracking-[0.35em] text-[#f7b801] uppercase">Practice · WebSocket</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight">Рівень 1 — базовий чат</h1>
        </div>
        <RouterLink
          to="/"
          class="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-300 transition hover:border-white/30 hover:text-white"
        >
          ← На головну
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-6 py-8">
      <p class="text-sm leading-relaxed text-zinc-400">
        Реалізуй підключення, <code class="text-zinc-300">onopen</code> / <code class="text-zinc-300">onmessage</code> /
        <code class="text-zinc-300">onclose</code> / <code class="text-zinc-300">onerror</code> та
        <code class="text-zinc-300">send()</code> нижче.
      </p>
      <div>Status: {{ status }}</div>
      <!-- Твій код: список повідомлень -->
      <section
        class="mt-8 min-h-70 rounded-2xl border border-dashed border-white/20 bg-black/20 p-4"
        aria-label="Повідомлення"
      >
        <p v-for="(msg, i) in messages" :key="i" class="text-sm text-zinc-200">{{ msg }}</p>
      </section>

      <!-- Твій код: інпут + кнопка «Відправити» -->
      <form class="mt-4 flex gap-2" @submit.prevent = "sendMessage">
        <input
          v-model="draft"
          type="text"
          class="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-[#f7b801]/50"
          placeholder="Повідомлення…"
        />
        <button
          :disabled="status !== 'open'"
          type="submit"
          class="rounded-xl bg-[#d62828] px-5 py-3 text-sm font-semibold text-white opacity-50"
        >
          Відправити
        </button>
      </form>
    </main>
  </div>
</template>
