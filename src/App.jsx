import { useEffect, useRef, useState, useCallback } from 'react'
import { Menu } from 'lucide-react'
import { Navbar } from './components/Navbar'
import { LiveLogTab } from './tabs/LiveLogTab'
import { MapTab } from './tabs/MapTab'
import { PlannerTab } from './tabs/PlannerTab'
import { TodoTab } from './tabs/TodoTab'
import { SettingsTab } from './tabs/SettingsTab'
import { useTelemetryStore } from './store/useTelemetryStore'

const TABS = [
  { id: 'live', component: LiveLogTab },
  { id: 'map', component: MapTab },
  { id: 'planner', component: PlannerTab },
  { id: 'todo', component: TodoTab },
  { id: 'settings', component: SettingsTab },
]

function WebSocketManager() {
  const {
    isConnected,
    setConnected,
    setConnectionError,
    updatePlayerTelemetry,
    updatePowerGrid,
    addLogEntry,
    addBuilding,
    addResourceNode,
  } = useTelemetryStore()

  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const wsUrlRef = useRef(localStorage.getItem('wsUrl') || 'ws://127.0.0.1:8080')
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 10

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(wsUrlRef.current)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WS] Connected to', wsUrlRef.current)
        setConnected(true)
        setConnectionError(null)
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data)
        } catch (err) {
          console.error('[WS] Failed to parse message:', err)
        }
      }

      ws.onclose = (event) => {
        console.log('[WS] Disconnected:', event.code, event.reason)
        setConnected(false)

        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current), 30000)
          reconnectAttempts.current++
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`)
          reconnectTimeoutRef.current = setTimeout(connect, delay)
        } else {
          setConnectionError('Max reconnection attempts reached. Please check the game mod.')
        }
      }

      ws.onerror = (error) => {
        console.error('[WS] Error:', error)
        setConnectionError('WebSocket connection error')
      }
    } catch (err) {
      console.error('[WS] Failed to create connection:', err)
      setConnectionError(err.message)
    }
  }, [setConnected, setConnectionError])

  const handleMessage = (data) => {
    // Add to log history
    addLogEntry(data)

    // Handle specific event types
    switch (data.event) {
      case 'PlayerTelemetry':
        updatePlayerTelemetry(data.data)
        break
      case 'PowerGridUpdate':
        updatePowerGrid(data.data)
        break
      case 'BuildingConstructed':
        addBuilding(data.data)
        break
      case 'ResourceNodeFound':
        addResourceNode(data.data)
        break
      default:
        // Unknown event, just log it
        break
    }
  }

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'App closing')
      wsRef.current = null
    }
    setConnected(false)
  }, [setConnected])

  // Listen for URL changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'wsUrl' && e.newValue !== wsUrlRef.current) {
        wsUrlRef.current = e.newValue
        disconnect()
        connect()
      }
    }

    const handleReconnect = () => {
      disconnect()
      reconnectAttempts.current = 0
      connect()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('ws-reconnect', handleReconnect)

    connect()

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('ws-reconnect', handleReconnect)
      disconnect()
    }
  }, [connect, disconnect])

  return null
}

export default function App() {
  const [activeTab, setActiveTab] = useState('live')

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-950">
      <WebSocketManager />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="h-full w-full pt-16" style={{ marginLeft: '256px' }}>
        <div className="h-full w-full relative">
          {TABS.map(({ id, component: Component }) => (
            <div
              key={id}
              className={`absolute inset-0 ${activeTab === id ? 'block' : 'hidden'}`}
              role="tabpanel"
              aria-labelledby={`tab-${id}`}
            >
              <Component />
            </div>
          ))}
        </div>
      </main>

      {/* Mobile sidebar toggle */}
      <button
        className="fixed bottom-4 right-4 z-50 lg:hidden p-3 rounded-full bg-gray-900 border border-gray-700 text-white shadow-lg"
        onClick={() => document.querySelector('aside')?.classList.toggle('-translate-x-full')}
        aria-label="Toggle sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>
    </div>
  )
}