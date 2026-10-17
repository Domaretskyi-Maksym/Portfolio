<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

/**
 * Рівень 2 — лайв-дашборд (потік даних)
 *
 * wss://stream.binance.com:9443/ws/btcusdt@trade
 * У кожному кадрі JSON: поле "p" — ціна (string → number).
 * Не зберігай усі trades у масив — лише lastPrice + trend.
 */

  let price = ref<number | null>(null);
  let prevPrice = ref<number | null>(null);
  let status = ref<"open"| "closed" | "error" | "connect">("connect"); 

  const trend = computed(() => {
    if (price.value === null || prevPrice.value === null) return "same";
    if (price.value > prevPrice.value) return "up";
    if (price.value < prevPrice.value) return "down";
    return 'same'
  })


let ws: WebSocket | null = null

onMounted(() => {
  ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade')
  ws.onmessage = (event) => {
    try {
      prevPrice.value = price.value
      const data = JSON.parse(event.data)
      price.value = Number(data.p)
    } catch {
      // ignore invalid frames
    }
  }

  ws.onclose = () => status.value = "closed";
  ws.onopen = () => status.value = "open";
  ws.onerror = () => status.value = "error";
})

onUnmounted(() => {
  ws?.close()
  ws = null
})

</script>

<template>
  <div class="min-h-screen bg-[#02030a] text-zinc-100">
    <header class="border-b border-white/10 px-6 py-4">
      <div class="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-semibold tracking-[0.35em] text-[#f7b801] uppercase">Practice · WebSocket</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight">Рівень 2 — BTC/USDT live</h1>
        </div>
        <nav class="flex shrink-0 gap-2 text-sm">
          <RouterLink
            to="/practice/ws/level-1"
            class="rounded-lg border border-white/15 px-3 py-2 text-zinc-300 transition hover:border-white/30 hover:text-white"
          >
            ← Рівень 1
          </RouterLink>
          <RouterLink
            to="/"
            class="rounded-lg border border-white/15 px-3 py-2 text-zinc-300 transition hover:border-white/30 hover:text-white"
          >
            Головна
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-6 py-8">
      <p class="text-sm leading-relaxed text-zinc-400">
        Підключись до Binance trade stream, парси <code class="text-zinc-300">p</code>, порівнюй з попередньою ціною —
        зелений / червоний. <code class="text-zinc-300">ws.close()</code> у
        <code class="text-zinc-300">onUnmounted</code>.
      </p>

      <!-- Твій код: status, ціна, колір trend -->
      <div
        class="mt-8 flex min-h-50 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/20 p-8"
      >
        <p class="text-xs tracking-[0.3em] text-zinc-500 uppercase">BTC / USDT</p>
        <p class="mt-4 font-mono text-4xl font-bold" :class="{
  'text-green-400': trend === 'up',
  'text-red-400': trend === 'down',
  'text-zinc-300': trend === 'same',
}">{{ price?.toLocaleString() }}</p>
        <p class="mt-2 text-sm text-zinc-600">Status: {{ status }}</p>


      </div>
    </main>
  </div>
</template>
