import { useEffect, useRef, useState, useCallback } from 'react'

// Usage: const { status, lastMessage, sendMessage } = useDroneWebSocket(droneId, wsUrl)
export default function useDroneWebSocket(droneId, wsUrl) {
  const [status, setStatus] = useState('disconnected') // 'connecting', 'connected', 'disconnected', 'error'
  const [lastMessage, setLastMessage] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimeout = useRef(null)

  const connect = useCallback(() => {
    if (!droneId || !wsUrl) return
    setStatus('connecting')
    const ws = new window.WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      // Authenticate with drone_id if required by backend
      ws.send(JSON.stringify({ type: 'auth', drone_id: droneId }))
    }
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
      } catch {
        setLastMessage(event.data)
      }
    }
    ws.onerror = () => {
      setStatus('error')
    }
    ws.onclose = () => {
      setStatus('disconnected')
      // Attempt reconnect after delay
      reconnectTimeout.current = setTimeout(connect, 3000)
    }
  }, [droneId, wsUrl])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) wsRef.current.close()
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
    }
  }, [connect])

  const sendMessage = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  return { status, lastMessage, sendMessage }
} 