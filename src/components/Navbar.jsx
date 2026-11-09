import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Map,
  GitBranch,
  ListChecks,
  Settings,
  Minimize,
  Maximize,
  X,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useTelemetryStore } from '../store/useTelemetryStore'

const tabs = [
  { id: 'live', label: 'Live Log & Stats', icon: LayoutDashboard },
  { id: 'map', label: 'Interactive Map', icon: Map },
  { id: 'planner', label: 'Production Planner', icon: GitBranch },
  { id: 'todo', label: 'To-Do & Materials', icon: ListChecks },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Navbar({ activeTab, setActiveTab }) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const { isConnected } = useTelemetryStore()

  useEffect(() => {
    const handleMaximizeChange = (maximized) => setIsMaximized(maximized)
    window.electronAPI?.onMaximizeChange(handleMaximizeChange)
    return () => window.electronAPI?.onMaximizeChange?.(null)
  }, [])

  const handleMinimize = () => window.electronAPI?.minimize()
  const handleMaximize = () => window.electronAPI?.maximize()
  const handleClose = () => window.electronAPI?.close()

  return (
    <>
      {/* Vertical Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full bg-gray-950 border-r border-gray-800 transition-all duration-300 flex flex-col ${collapsed ? 'w-16' : 'w-64'}`}
        aria-label="Main navigation"
      >
        {/* Logo / Title */}
        <div className={`flex items-center justify-between h-16 px-4 border-b border-gray-800 ${collapsed ? 'justify-center' : ''}`}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-gray-950" />
              </div>
              <span className="font-bold text-lg text-white">Satisfactory Companion</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto">
              <GitBranch className="w-5 h-5 text-gray-950" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`sidebar-btn w-full ${activeTab === tab.id ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              title={collapsed ? tab.label : undefined}
            >
              <tab.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span className="font-medium">{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Connection Status */}
        <div className={`p-3 border-t border-gray-800 ${collapsed ? 'hidden' : ''}`}>
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </aside>

      {/* Top Bar - Window Controls */}
      <div className="fixed top-0 right-0 z-50 flex items-center gap-1 pr-4 py-2" style={{ marginLeft: collapsed ? '64px' : '256px' }}>
        <div className="flex items-center gap-1 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-1">
          <button onClick={handleMinimize} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" aria-label="Minimize">
            <Minimize className="w-4 h-4" />
          </button>
          <button onClick={handleMaximize} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" aria-label={isMaximized ? 'Restore' : 'Maximize'}>
            {isMaximized ? <ChevronLeft className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <button onClick={handleClose} className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}