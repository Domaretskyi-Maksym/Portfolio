<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Рівень 3 — локальний чат + reconnect + heartbeat
 * ws://localhost:8080 (npm run ws:server)
 */

const WS_URL = 'ws://localhost:8080'
const HEARTBEAT_MS = 5000 // як часто питаємо «ти живий?»
const PONG_WAIT_MS = 3000 // скільки чекаємо відповідь після ping

const messages = ref<string[]>([])
const draft = ref('')
const status = ref<'Open' | 'Closed' | 'Error' | 'Connecting'>('Connecting')
const attempt = ref(0)
const delay = ref(0)
const lastPongAt = ref<string>('—')

// Reconnect: один запланований setTimeout, щоб не дублювати connect()
const reconnectTimeoutId = ref<number | null>(null)

// Heartbeat: interval (ping) + timeout (watchdog, якщо нема pong)
let heartbeatIntervalId: ReturnType<typeof setInterval> | null = null
let pongTimeoutId: number | null = null

let ws: WebSocket | null = null
// Прапорець: onclose після ws.close() на unmount не має запускати reconnect
let isUnmounting = false

function clearReconnectTimeout() {
  if (reconnectTimeoutId.value != null) {
    clearTimeout(reconnectTimeoutId.value)
    reconnectTimeoutId.value = null
  }
}

/** Скидаємо watchdog після ping — або pong прийшов, або готуємо новий ping */
function clearPongWatchdog() {
  if (pongTimeoutId != null) {
    clearTimeout(pongTimeoutId)
    pongTimeoutId = null
  }
}

/** Зупиняємо heartbeat, щоб після reconnect / unmount не лишилось кілька interval */
function stopHeartbeat() {
  if (heartbeatIntervalId != null) {
    clearInterval(heartbeatIntervalId)
    heartbeatIntervalId = null
  }
  clearPongWatchdog()
}

/** Після ping даємо серверу PONG_WAIT_MS; інакше вважаємо з’єднання мертвим і close() → reconnect */
function startPongWatchdog() {
  clearPongWatchdog()
  pongTimeoutId = window.setTimeout(() => {
    pongTimeoutId = null
    ws?.close()
  }, PONG_WAIT_MS)
}

/** Стартуємо лише з onopen — кожен успішний connect отримує один interval */
function startHeartbeat() {
  stopHeartbeat()

  heartbeatIntervalId = setInterval(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(JSON.stringify({ type: 'ping' }))
    startPongWatchdog()
  }, HEARTBEAT_MS)
}

function calculateDelay() {
  const calculated = 1000 * 2 ** (attempt.value - 1)
  return Math.min(calculated, 8000)
}

function connect() {
  status.value = 'Connecting'
  ws = new WebSocket(WS_URL)

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as { type?: string; text?: string }

      // Службовий кадр heartbeat — не показуємо в чаті
      if (data.type === 'pong') {
        lastPongAt.value = new Date().toLocaleTimeString()
        clearPongWatchdog()
        return
      }

      if (data.type === 'system' || data.type === 'message') {
        if (typeof data.text === 'string') {
          messages.value = [...messages.value, data.text]
        }
        return
      }
    } catch {
      // plain text від старого формату send
      messages.value = [...messages.value, String(event.data)]
    }
  }

  ws.onopen = () => {
    clearReconnectTimeout()
    status.value = 'Open'
    attempt.value = 0
    delay.value = 0
    startHeartbeat()
  }

  ws.onclose = () => {
    stopHeartbeat()
    status.value = 'Closed'

    if (isUnmounting) return

    attempt.value++
    delay.value = calculateDelay()
    clearReconnectTimeout()
    reconnectTimeoutId.value = window.setTimeout(connect, delay.value)
  }

  ws.onerror = () => {
    status.value = 'Error'
  }
}

function sendMessage() {
  const text = draft.value.trim()
  if (!text) return
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn('Ще не підключено')
    return
  }
  ws.send(text)
  draft.value = ''
}

onMounted(() => {
  connect()
})

onUnmounted(() => {
  isUnmounting = true
  clearReconnectTimeout()
  stopHeartbeat()
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
          <h1 class="mt-1 text-2xl font-bold tracking-tight">Рівень 3 — reconnect + heartbeat</h1>
        </div>
        <nav class="flex shrink-0 gap-2 text-sm">
          <RouterLink
            to="/practice/ws/level-2"
            class="rounded-lg border border-white/15 px-3 py-2 text-zinc-300 transition hover:border-white/30 hover:text-white"
          >
            ← Рівень 2
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
      <div class="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-xs text-zinc-500">
        status: {{ status }} · reconnect attempt: {{ attempt }} · next delay: {{ delay }} ms · last pong:
        {{ lastPongAt }}
      </div>

      <section
        class="mt-6 min-h-60 rounded-2xl border border-dashed border-white/20 bg-black/20 p-4"
        aria-label="Повідомлення"
      >
        <p v-for="(message, index) in messages" :key="index" class="text-sm text-zinc-200">{{ message }}</p>
      </section>

      <form class="mt-4 flex gap-2" @submit.prevent="sendMessage">
        <input
          v-model="draft"
          type="text"
          placeholder="Повідомлення…"
          :disabled="status !== 'Open'"
          class="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          :disabled="status !== 'Open'"
          class="rounded-xl bg-[#d62828] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Відправити
        </button>
      </form>
    </main>
  </div>
</template>
