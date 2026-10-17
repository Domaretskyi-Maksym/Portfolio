import { readonly, ref, type Ref } from 'vue'

/** Статус з'єднання для UI */
export type ConnectionStatus = 'connecting' | 'open' | 'closed' | 'error'

export interface UseWebSocketOptions {
  /** ws:// або wss:// */
  url: string
  /** Авто-підключення при створенні composable (alternativa: виклик connect() з onMounted) */
  immediate?: boolean
  /** Увімкнути application ping/pong + watchdog */
  heartbeat?: boolean
  /** Увімкнути reconnect у onclose з exponential backoff */
  reconnect?: boolean
}

export interface UseWebSocketReturn {
  status: Readonly<Ref<ConnectionStatus>>
  messages: Readonly<Ref<readonly string[]>>
  reconnectAttempt: Readonly<Ref<number>>
  nextDelayMs: Readonly<Ref<number>>
  lastPongAt: Readonly<Ref<string>>

  /** Створити WebSocket і повісити onopen / onmessage / onclose / onerror */
  connect: () => void
  /** Закрити сокет, зупинити timers, не reconnect (unmount / logout) */
  disconnect: () => void
  /** Надіслати текст або JSON (plain string для чату) */
  send: (payload: string | Record<string, unknown>) => void
}

/**
 * Vue 3 — шаблон для Рівня 4. Заповни тіла функцій (логіка з WebSocketLevel3View).
 *
 * Рекомендований lifecycle:
 * - або options.immediate + onScopeDispose(disconnect)
 * - або view: onMounted(connect), onUnmounted(disconnect)
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { url, immediate = false } = options

  const status = ref<ConnectionStatus>('connecting')
  const messages = ref<string[]>([])
  const reconnectAttempt = ref(0)
  const nextDelayMs = ref(0)
  const lastPongAt = ref('—')

  // TODO: let ws: WebSocket | null = null
  // TODO: isUnmounting, reconnectTimeoutId, heartbeatIntervalId, pongTimeoutId

  function connect(): void {
    void url
    // TODO: status = 'connecting'
    // TODO: ws = new WebSocket(url)
    // TODO: ws.onopen → status open, reset backoff, startHeartbeat()
    // TODO: ws.onmessage → parse type (pong / system / message)
    // TODO: ws.onclose → stopHeartbeat(); if (!isUnmounting) scheduleReconnect()
    // TODO: ws.onerror → status error
  }

  function disconnect(): void {
    // TODO: isUnmounting = true
    // TODO: clear reconnect + heartbeat timers
    // TODO: ws?.close(); ws = null
  }

  function send(_payload: string | Record<string, unknown>): void {
    // TODO: if readyState !== OPEN → return
    // TODO: typeof payload === 'string' ? send : JSON.stringify
  }

  // TODO (private): scheduleReconnect(), calculateDelay(), startHeartbeat(), stopHeartbeat(), startPongWatchdog()

  if (immediate) {
    connect()
    // TODO: import { onScopeDispose } from 'vue' → onScopeDispose(disconnect)
  }

  return {
    status: readonly(status),
    messages: readonly(messages),
    reconnectAttempt: readonly(reconnectAttempt),
    nextDelayMs: readonly(nextDelayMs),
    lastPongAt: readonly(lastPongAt),
    connect,
    disconnect,
    send,
  }
}
