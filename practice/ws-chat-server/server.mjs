import { WebSocketServer, WebSocket } from 'ws'

const PORT = Number(process.env.PORT) || 8080
const wss = new WebSocketServer({ port: PORT })

console.log(`WebSocket chat: ws://localhost:${PORT}`)

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'system', text: 'Підключено до локального чату.' }))

  ws.on('message', (raw) => {
    const text = raw.toString()

    try {
      const msg = JSON.parse(text)
      if (msg?.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', at: Date.now() }))
        return
      }
    } catch {
      // plain text chat (level 1)
    }

    const payload = JSON.stringify({ type: 'message', text, at: Date.now() })

    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(payload)
    }
  })
})
