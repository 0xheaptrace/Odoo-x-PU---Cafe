import { io } from 'socket.io-client'
import { useEffect, useRef, useState } from 'react'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL

// Hook for Socket.io kitchen display connection
export function useKitchenSocket() {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join_kitchen')
    })

    socket.on('disconnect', () => setConnected(false))

    return () => {
      socket.disconnect()
    }
  }, [])

  const on = (event, handler) => {
    socketRef.current?.on(event, handler)
    return () => socketRef.current?.off(event, handler)
  }

  const emit = (event, data) => socketRef.current?.emit(event, data)

  return { connected, on, emit, socket: socketRef }
}

export function useRealtimeUpdates() {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join_updates')
    })

    socket.on('disconnect', () => setConnected(false))

    return () => {
      socket.disconnect()
    }
  }, [])

  const on = (event, handler) => {
    socketRef.current?.on(event, handler)
    return () => socketRef.current?.off(event, handler)
  }

  return { connected, on, socket: socketRef }
}
