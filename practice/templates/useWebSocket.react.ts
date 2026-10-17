/**
 * REACT TEMPLATE — скопіюй у React-проєкт: src/hooks/useWebSocket.ts
 * Цей репозиторій (Vue) файл не збирає. Потрібні: react, react-dom.
 *
 * Lifecycle: useEffect(() => { connect(); return () => disconnect() }, [url])
 * Сокет: useRef<WebSocket | null>(null) — не useState
 * Список: setMessages(prev => [...prev, text]) у onmessage
 */

export type ConnectionStatus = 'connecting' | 'open' | 'closed' | 'error'

export interface UseWebSocketOptions {
  url: string
  heartbeat?: boolean
  reconnect?: boolean
}

export interface UseWebSocketReturn {
  status: ConnectionStatus
  messages: string[]
  reconnectAttempt: number
  nextDelayMs: number
  lastPongAt: string

  connect: () => void
  disconnect: () => void
  send: (payload: string | Record<string, unknown>) => void
}

/**
 * Заміни тіло на реалізацію з useRef / useState / useEffect / useCallback.
 * Нижче — заглушка, щоб TypeScript показував контракт.
 */
export function useWebSocket(_options: UseWebSocketOptions): UseWebSocketReturn {
  const connect = (): void => {
    // TODO: wsRef.current = new WebSocket(url)
    // TODO: assign onopen, onmessage, onclose, onerror on wsRef.current
  }

  const disconnect = (): void => {
    // TODO: isUnmountingRef.current = true
    // TODO: clearInterval / clearTimeout
    // TODO: wsRef.current?.close(); wsRef.current = null
  }

  const send = (_payload: string | Record<string, unknown>): void => {
    // TODO: wsRef.current?.readyState === WebSocket.OPEN
  }

  // TODO: useEffect with connect + return disconnect cleanup
  // TODO (private): scheduleReconnect, startHeartbeat, stopHeartbeat, startPongWatchdog

  return {
    status: 'connecting',
    messages: [],
    reconnectAttempt: 0,
    nextDelayMs: 0,
    lastPongAt: '—',
    connect,
    disconnect,
    send,
  }
}
