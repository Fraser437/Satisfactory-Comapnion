import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Filter, Pause, Play, Trash2, Copy, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { StatCard, PowerGauge, LocationCard } from '../components/StatCard'
import { JSONViewer } from '../components/JSONViewer'
import { useTelemetryStore } from '../store/useTelemetryStore'

export function LiveLogTab() {
  const {
    isConnected,
    playerLocation,
    playerRotation,
    biome,
    powerGrid,
    logHistory,
    selectedLogIndex,
    autoScroll,
    logFilter,
    setSelectedLogIndex,
    setAutoScroll,
    setLogFilter,
    clearLogs,
    getFilteredLogs,
    getPowerPercentage,
  } = useTelemetryStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showJSONViewer, setShowJSONViewer] = useState(false)
  const logContainerRef = useRef(null)

  const filteredLogs = getFilteredLogs()

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLogs.length, autoScroll])

  const handleLogClick = useCallback((index) => {
    const actualIndex = logHistory.findIndex((_, i) => i === index)
    if (actualIndex !== -1) {
      setSelectedLogIndex(actualIndex)
      setShowJSONViewer(true)
    }
  }, [logHistory, setSelectedLogIndex, setShowJSONViewer])

  const handleFilteredLogClick = useCallback((filteredIndex) => {
    const log = filteredLogs[filteredIndex]
    if (log) {
      const actualIndex = logHistory.indexOf(log)
      if (actualIndex !== -1) {
        setSelectedLogIndex(actualIndex)
        setShowJSONViewer(true)
      }
    }
  }, [filteredLogs, logHistory, setSelectedLogIndex, setShowJSONViewer])

  const copyLog = (log) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2))
  }

  const exportLogs = () => {
    const data = JSON.stringify(logHistory, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `satisfactory-logs-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getEventColor = (event) => {
    switch (event) {
      case 'PlayerTelemetry': return 'text-cyan-400'
      case 'PowerGridUpdate': return 'text-yellow-400'
      case 'BuildingConstructed': return 'text-emerald-400'
      case 'MilestoneCompleted': return 'text-purple-400'
      default: return 'text-gray-300'
    }
  }

  return (
    <div className="tab-panel p-6 space-y-6 overflow-hidden">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Connection"
          value={isConnected ? 'Connected' : 'Disconnected'}
          icon={isConnected ? <span className="w-5 h-5 text-emerald-400">●</span> : <span className="w-5 h-5 text-red-400">●</span>}
          status={isConnected ? 'ok' : 'danger'}
        />
        <PowerGauge
          capacity={powerGrid.capacity_mw}
          production={powerGrid.production_mw}
          consumption={powerGrid.consumption_mw}
          isTripped={powerGrid.is_tripped}
        />
        <LocationCard
          location={playerLocation}
          biome={biome}
          rotation={playerRotation}
        />
        <StatCard
          label="Log Entries"
          value={logHistory.length}
          unit={` / ${500}`}
          icon={<span className="w-5 h-5 text-blue-400">📋</span>}
          trend={0}
        />
      </div>

      {/* Log Feed */}
      <div className="card flex flex-col h-[calc(100%-200px)] min-h-[400px]">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Filter logs by event type or content..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setLogFilter(e.target.value)
              }}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`btn-secondary ${autoScroll ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500/50' : ''}`}
              aria-pressed={autoScroll}
            >
              {autoScroll ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">Auto-scroll</span>
            </button>
            <button onClick={exportLogs} className="btn-secondary" title="Export logs">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={clearLogs} className="btn-secondary text-red-400 hover:bg-red-900/30 hover:border-red-500/50" title="Clear logs">
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>

        {/* Log List */}
        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto scrollbar-thin"
          role="list"
          aria-label="Telemetry log feed"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <Filter className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg">No log entries</p>
              <p className="text-sm">Waiting for WebSocket connection...</p>
            </div>
          ) : (
            <div className="p-4 space-y-0.5" role="listbox">
              {filteredLogs.map((entry, index) => (
                <div
                  key={entry.timestamp + index}
                  onClick={() => handleFilteredLogClick(index)}
                  className={`log-entry ${selectedLogIndex === logHistory.indexOf(entry) ? 'selected' : ''} ${entry.event === 'PowerGridUpdate' && entry.data.is_tripped ? 'log-entry-warning' : ''}`}
                  role="option"
                  aria-selected={selectedLogIndex === logHistory.indexOf(entry)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilteredLogClick(index)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-gray-500 w-20 shrink-0">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${getEventColor(entry.event)}`}
                    >
                      {entry.event}
                    </span>
                    <span className="text-gray-400 text-xs truncate">
                      {JSON.stringify(entry.data).slice(0, 120)}
                      {JSON.stringify(entry.data).length > 120 ? '...' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* JSON Viewer Modal */}
      {showJSONViewer && selectedLogIndex !== null && (
        <JSONViewer
          data={logHistory[selectedLogIndex]}
          onClose={() => {
            setShowJSONViewer(false)
            setSelectedLogIndex(null)
          }}
        />
      )}
    </div>
  )
}