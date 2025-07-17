import { useEffect } from 'react'
import useDroneWebSocket from '../hooks/useDroneWebSocket'

const DroneWebSocketManager = ({ drone, wsUrl, onUpdate }) => {
  const { lastMessage } = useDroneWebSocket(drone.id, `${wsUrl}?drone_id=${drone.id}`)

  useEffect(() => {
    if (lastMessage) {
      onUpdate(drone.id, lastMessage)
    }
  }, [lastMessage, drone.id, onUpdate])

  return null // No UI
}

export default DroneWebSocketManager 