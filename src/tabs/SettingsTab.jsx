import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Monitor, Sun, Moon, Save, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useTelemetryStore } from '../store/useTelemetryStore'

export function SettingsTab() {
  const { isConnected, connectionError, setConnected, setConnectionError } = useTelemetryStore()
  const [wsUrl, setWsUrl] = useState('ws://127.0.0.1:8080')
  const [theme, setTheme] = useState('dark')
  const [status, setStatus] = useState({ type: null, message: '' })
  const [isTesting, setIsTesting] = useState(false)

  // Load saved settings
  useEffect(() => {
    const savedUrl = localStorage.getItem('wsUrl')
    const savedTheme = localStorage.getItem('theme')
    if (savedUrl) setWsUrl(savedUrl)
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('wsUrl', wsUrl)
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    setStatus({ type: 'success', message: 'Settings saved successfully!' })
    setTimeout(() => setStatus({ type: null, message: '' }), 3000)
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setStatus({ type: 'info', message: 'Testing connection...' })

    try {
      const ws = new WebSocket(wsUrl)
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close()
          reject(new Error('Connection timeout'))
        }, 5000)

        ws.onopen = () => {
          clearTimeout(timeout)
          ws.close()
          resolve()
        }
        ws.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('Connection failed'))
        }
      })
      setStatus({ type: 'success', message: 'Connection successful!' })
      setConnected(true)
    } catch (err) {
      setStatus({ type: 'error', message: `Connection failed: ${err.message}` })
      setConnectionError(err.message)
      setConnected(false)
    } finally {
      setIsTesting(false)
      setTimeout(() => setStatus({ type: null, message: '' }), 5000)
    }
  }

  const handleReconnect = () => {
    setConnectionError(null)
    // The WebSocket hook in App.jsx will handle reconnection
    window.dispatchEvent(new CustomEvent('ws-reconnect'))
  }

  return (
    <div className="tab-panel p-6 space-y-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-white">Settings</h2>

      {/* Connection Settings */}
      <div className="card p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Wifi className="w-5 h-5 text-emerald-400" />
          WebSocket Connection
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">WebSocket URL</label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              className="input-field font-mono"
              placeholder="ws://127.0.0.1:8080"
            />
            <p className="text-xs text-gray-500 mt-1">
              The in-game mod should connect to this address. Default: <code className="font-mono">ws://127.0.0.1:8080</code>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg border border-gray-700 flex-1">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <div>
                <p className="font-medium text-white">Connection Status</p>
                <p className="text-sm text-gray-400">
                  {isConnected ? 'Connected to game' : 'Disconnected'}
                </p>
              </div>
            </div>
          </div>

          {connectionError && (
            <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{connectionError}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="btn-primary flex items-center gap-2"
            >
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleReconnect}
              disabled={isConnected}
              className="btn-secondary flex items-center gap-2"
            >
              <Wifi className="w-4 h-4" />
              Reconnect
            </button>
          </div>

          {status.message && (
            <div className={`p-3 rounded-lg flex items-center gap-3 text-sm ${
              status.type === 'success' ? 'bg-emerald-900/30 border border-emerald-500/30 text-emerald-300' :
              status.type === 'error' ? 'bg-red-900/30 border border-red-500/30 text-red-300' :
              'bg-blue-900/30 border border-blue-500/30 text-blue-300'
            }`}>
              {status.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {status.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {status.type === 'info' && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>{status.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="card p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Monitor className="w-5 h-5 text-emerald-400" />
          Appearance
        </h3>

        <div>
          <label className="block text-sm text-gray-300 mb-3">Theme</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-emerald-400 bg-emerald-900/30 text-emerald-300'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-emerald-400 bg-emerald-900/30 text-emerald-300'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                theme === 'system'
                  ? 'border-emerald-400 bg-emerald-900/30 text-emerald-300'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <Monitor className="w-5 h-5" />
              <span>System</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <WifiOff className="w-5 h-5 text-emerald-400" />
          Data & Storage
        </h3>

        <div className="space-y-3">
          <p className="text-gray-400 text-sm">
            The app stores your shopping list, custom tasks, and planner layout in localStorage.
          </p>
          <div className="flex items-center gap-3">
            <button className="btn-danger flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Clear All Local Data
            </button>
            <span className="text-xs text-gray-500">This cannot be undone</span>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          Info
        </h3>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono text-white">0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span>Electron</span>
            <span className="font-mono text-white">{process.versions.electron}</span>
          </div>
          <div className="flex justify-between">
            <span>Node</span>
            <span className="font-mono text-white">{process.versions.node}</span>
          </div>
          <div className="flex justify-between">
            <span>Chrome</span>
            <span className="font-mono text-white">{process.versions.chrome}</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-800">
        <button onClick={handleSave} className="btn-primary px-8">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </button>
      </div>
    </div>
  )
}