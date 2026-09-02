import { getToken, getApiBase } from './api'

export default class CollabClient {
  constructor(docId, handlers = {}) {
    this.docId = docId
    this.handlers = handlers
    this.socket = null
    this.closed = false
    this.userId = null
    this.connected = false
    this.reconnectDelay = 1000
    this.connect()
  }

  wsUrl() {
    const token = encodeURIComponent(getToken() || '')
    const apiBase = getApiBase()
    let origin
    if (apiBase) {
      // Deployed: use the configured backend origin, http(s) -> ws(s).
      origin = apiBase.replace(/^http/, 'ws')
    } else {
      // Local dev: same host as the page (Vite proxies /ws to the backend).
      origin = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
    }
    return `${origin}/ws/documents/${this.docId}/?token=${token}`
  }

  connect() {
    if (this.closed) return
    this.socket = new WebSocket(this.wsUrl())

    this.socket.onopen = () => {
      this.reconnectDelay = 1000
    }

    this.socket.onmessage = (event) => {
      let data
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }
      this.route(data)
    }

    this.socket.onclose = () => {
      this.connected = false
      if (this.closed) return
      this.handlers.onStatus?.('Reconnecting…')
      setTimeout(() => this.connect(), this.reconnectDelay)
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 8000)
    }

    this.socket.onerror = () => {
      this.socket?.close()
    }
  }

  route(data) {
    switch (data.type) {
      case 'connection.accepted':
        this.userId = data.user_id
        this.connected = true
        this.handlers.onConnected?.()
        // Establish authoritative state before the client is ready to edit.
        this.send({ action: 'sync' })
        break
      case 'state':
        this.handlers.onState?.(data)
        break
      case 'ack':
        this.handlers.onAck?.(data)
        break
      case 'reject':
        this.handlers.onReject?.(data)
        break
      case 'error':
        this.handlers.onError?.(data)
        break
      case 'broadcast':
        this.handlers.onBroadcast?.(data)
        break
      case 'presence.state':
        this.handlers.onPresenceState?.(data.users)
        break
      case 'presence.join':
        this.handlers.onPresenceJoin?.(data.user_id)
        break
      case 'presence.leave':
        this.handlers.onPresenceLeave?.(data.user_id)
        break
      default:
        break
    }
  }

  send(payload) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload))
      return true
    }
    return false
  }

  sendEdit(version, content) {
    return this.send({ action: 'edit', version, content })
  }

  close() {
    this.closed = true
    this.socket?.close()
  }
}