import { WebSocket, WebSocketServer } from 'ws'

let wss: WebSocketServer | null = null

const connectedClients = new Set<WebSocket>()

export function broadcastToClients(topic: string, data: unknown) {
  const message = JSON.stringify({ topic, data, timestamp: Date.now() })

  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

function initWebSocketServer() {
  if (wss) return wss

  wss = new WebSocketServer({
    port: 3003,
    host: 'localhost',
    path: '/ws',
  })

  wss.on('connection', (ws) => {
    console.log('Client connected to IoT stream')
    connectedClients.add(ws)

    ws.on('close', () => {
      console.log('Client disconnected from IoT stream')
      connectedClients.delete(ws)
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      connectedClients.delete(ws)
    })
  })

  return wss
}

export function startWebSocketServer() {
  return initWebSocketServer()
}

initWebSocketServer()

// if (process.argv.includes('--start')) {
//   startWebSocketServer()
// }
