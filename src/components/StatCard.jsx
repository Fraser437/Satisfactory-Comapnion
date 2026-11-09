import { Zap, MapPin, Wifi, Heart, AlertTriangle, Gauge } from 'lucide-react'

export function StatCard({ label, value, icon: Icon, unit = '', trend, className = '', status }) {
  const isWarning = status === 'warning'
  const isDanger = status === 'danger'

  return (
    <div className={`stat-card ${className} ${isDanger ? 'border-red-500/50' : ''} ${isWarning ? 'border-yellow-500/50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gray-800 ${isDanger ? 'bg-red-900/30 text-red-400' : isWarning ? 'bg-yellow-900/30 text-yellow-400' : 'text-emerald-400'}`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <p className="stat-label">{label}</p>
            {trend && (
              <p className={`text-xs font-mono ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {trend > 0 ? '+' : ''}{trend}{unit}/min
              </p>
            )}
          </div>
        </div>
        {status === 'tripped' && (
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" aria-label="Power grid tripped" />
        )}
      </div>
      <div className="mt-4">
        <p className={`stat-value ${isDanger ? 'text-red-400' : isWarning ? 'text-yellow-400' : ''}`}>
          {value}
          {unit && <span className="text-lg font-normal text-gray-400 ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  )
}

export function PowerGauge({ capacity, production, consumption, isTripped }) {
  const percentage = capacity > 0 ? Math.min(100, (consumption / capacity) * 100) : 0
  const productionPercentage = capacity > 0 ? Math.min(100, (production / capacity) * 100) : 0

  const getColor = (pct) => {
    if (pct >= 95) return 'bg-red-500'
    if (pct >= 80) return 'bg-yellow-500'
    if (pct >= 60) return 'bg-blue-500'
    return 'bg-emerald-500'
  }

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-800 text-yellow-400">
            <Zap className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <p className="stat-label">Power Grid</p>
            <p className="text-xs text-gray-400">Circuit 1</p>
          </div>
        </div>
        {isTripped && <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" aria-label="Power grid tripped" />}
      </div>

      <div className="space-y-3">
        {/* Capacity bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Capacity</span>
            <span className="font-mono text-white">{capacity.toFixed(1)} MW</span>
          </div>
          <div className="power-gauge">
            <div
              className="power-gauge-fill bg-gradient-to-r from-gray-600 to-gray-500"
              style={{ width: '100%' }}
              role="progressbar"
              aria-valuenow={100}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Total capacity"
            />
          </div>
        </div>

        {/* Production bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Production</span>
            <span className="font-mono text-emerald-400">{production.toFixed(1)} MW</span>
          </div>
          <div className="power-gauge">
            <div
              className={`power-gauge-fill ${getColor(productionPercentage)}`}
              style={{ width: `${productionPercentage}%` }}
              role="progressbar"
              aria-valuenow={Math.round(productionPercentage)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Current production"
            />
          </div>
        </div>

        {/* Consumption bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Consumption</span>
            <span className="font-mono text-white">{consumption.toFixed(1)} MW</span>
          </div>
          <div className="power-gauge">
            <div
              className={`power-gauge-fill ${getColor(percentage)} ${isTripped ? 'animate-pulse' : ''}`}
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={Math.round(percentage)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Current consumption"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="flex justify-between text-xs pt-2 border-t border-gray-800">
          <span className="text-gray-400">Headroom</span>
          <span className={`font-mono ${capacity - consumption < 500 ? 'text-red-400' : capacity - consumption < 1000 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {(capacity - consumption).toFixed(1)} MW
          </span>
        </div>

        {isTripped && (
          <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>POWER GRID TRIPPED - Exceeded capacity!</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function LocationCard({ location, biome, rotation }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gray-800 text-cyan-400">
          <MapPin className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <p className="stat-label">Location</p>
          <p className="text-xs text-gray-400">{biome}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider">X</p>
          <p className="font-mono text-white text-lg">{location.x.toFixed(1)}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Y</p>
          <p className="font-mono text-white text-lg">{location.y.toFixed(1)}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Z</p>
          <p className="font-mono text-white text-lg">{location.z.toFixed(1)}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">Ping</span>
          <span className="font-mono text-white">0ms</span>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-400" />
          <span className="text-xs text-gray-400">Health</span>
          <span className="font-mono text-white">100%</span>
        </div>
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">Rot</span>
          <span className="font-mono text-white">{rotation.toFixed(0)}°</span>
        </div>
      </div>
    </div>
  )
}