import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Layers, RefreshCw, Crosshair, Maximize2, Minimize2 } from 'lucide-react'
import { useTelemetryStore } from '../store/useTelemetryStore'

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Satisfactory coordinate transformation
// Game coordinates: X/Y range roughly -400000 to 400000
// Map coordinates: Lat/Lng for Leaflet
const GAME_TO_MAP_SCALE = 1 / 1000 // 1000 game units = 1 map unit
const MAP_CENTER = [0, 0] // Center of the map

const gameToMap = (x, y) => {
  // Satisfactory uses X (East-West) and Y (North-South), Z is height
  // Leaflet uses [lat, lng] = [y, x]
  return [y * GAME_TO_MAP_SCALE, x * GAME_TO_MAP_SCALE]
}

const mapToGame = (lat, lng) => {
  return { x: lng / GAME_TO_MAP_SCALE, y: lat / GAME_TO_MAP_SCALE }
}

// Custom markers
const PlayerMarker = ({ position, rotation }) => {
  const [map, setMap] = useState(null)

  useEffect(() => {
    // Keep marker centered by not doing anything special
  }, [position])

  return (
    <Marker position={position} icon={createPlayerIcon(rotation)}>
      <Popup>
        <div className="text-white p-1">
          <strong>Player</strong><br />
          X: {position[1] / GAME_TO_MAP_SCALE.toFixed(0)}<br />
          Y: {position[0] / GAME_TO_MAP_SCALE.toFixed(0)}<br />
          Rotation: {rotation.toFixed(0)}°
        </div>
      </Popup>
    </Marker>
  )
}

function createPlayerIcon(rotation) {
  return L.divIcon({
    className: 'player-marker-custom',
    html: `
      <div style="
        width: 24px; height: 24px;
        background: #00d4aa;
        border: 3px solid white;
        border-radius: 50%;
        transform: rotate(${rotation}deg);
        box-shadow: 0 0 12px #00d4aa;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <polygon points="12 2 19 21 12 17 5 21 12 2" />
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

const BuildingMarker = ({ building }) => {
  const position = gameToMap(building.location.x, building.location.y)
  const color = getBuildingColor(building.building_id)

  return (
    <Marker position={position} icon={createBuildingIcon(color, building.name)}>
      <Popup>
        <div className="text-white p-1 min-w-[200px]">
          <strong className="text-emerald-300">{building.name}</strong><br />
          <span className="text-gray-400 text-xs">{building.building_id}</span><br />
          {building.recipe && <span>Recipe: {building.recipe}</span>}<br />
          X: {building.location.x.toFixed(0)} Y: {building.location.y.toFixed(0)} Z: {building.location.z.toFixed(0)}
        </div>
      </Popup>
    </Marker>
  )
}

function createBuildingIcon(color, name) {
  const initial = name.charAt(0).toUpperCase()
  return L.divIcon({
    className: 'building-marker-custom',
    html: `
      <div style="
        width: 28px; height: 28px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
      ">
        ${initial}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

const ResourceNodeMarker = ({ node }) => {
  const position = gameToMap(node.x, node.y)
  const color = getResourceColor(node.type)

  return (
    <CircleMarker
      center={position}
      radius={8}
      pathOptions={{
        fillColor: color,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9,
      }}
    >
      <Popup>
        <div className="text-white p-1">
          <strong className="text-yellow-300">{node.type}</strong><br />
          Purity: {node.purity}<br />
          X: {node.x.toFixed(0)} Y: {node.y.toFixed(0)}
        </div>
      </Popup>
    </CircleMarker>
  )
}

function getBuildingColor(buildingId) {
  if (buildingId.includes('Constructor')) return '#ff6b35'
  if (buildingId.includes('Assembler')) return '#f7931e'
  if (buildingId.includes('Manufacturer')) return '#e85d75'
  if (buildingId.includes('Smelter')) return '#ff3333'
  if (buildingId.includes('Foundry')) return '#ff9900'
  if (buildingId.includes('Refinery')) return '#00b4d8'
  if (buildingId.includes('Blender')) return '#9b59b6'
  if (buildingId.includes('Packager')) return '#2ecc71'
  if (buildingId.includes('Miner')) return '#7f8c8d'
  if (buildingId.includes('Pump')) return '#3498db'
  if (buildingId.includes('Generator') || buildingId.includes('Power')) return '#f39c12'
  return '#6366f1'
}

function getResourceColor(type) {
  const colors = {
    'Iron Ore': '#b87333',
    'Copper Ore': '#cd7f32',
    'Limestone': '#a8a8a8',
    'Coal': '#2d2d2d',
    'Caterium Ore': '#daa520',
    'Raw Quartz': '#e6e6fa',
    'Sulfur': '#ffdd00',
    'Bauxite': '#dd5522',
    'Uranium': '#7fff00',
    'Nitrogen Gas': '#7fffd4',
    'Crude Oil': '#1a1a1a',
    'Water': '#0066cc',
  }
  return colors[type] || '#888888'
}

// Map event handlers
function MapEvents({ onCenterPlayer, playerPosition }) {
  useMapEvents({
    click(e) {
      console.log('Map clicked:', e.latlng)
    },
  })
  return null
}

function MapControls({ onCenterPlayer, onToggleFullscreen, isFullscreen }) {
  const map = useMapEvents({})

  return (
    <div className="leaflet-control leaflet-bar" style={{ zIndex: 1000 }}>
      <button
        onClick={onCenterPlayer}
        className="leaflet-control-button"
        title="Center on Player"
        style={{
          background: '#1a1a1a',
          color: '#fff',
          border: 'none',
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Crosshair className="w-5 h-5" />
      </button>
      <button
        onClick={onToggleFullscreen}
        className="leaflet-control-button"
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        style={{
          background: '#1a1a1a',
          color: '#fff',
          border: 'none',
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid #333',
        }}
      >
        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>
    </div>
  )
}

// Custom tile layer for Satisfactory (using a simple dark map)
const SatisfactoryTileLayer = () => (
  <TileLayer
    attribution='&copy; <a href="https://satisfactory.fandom.com/wiki/Map">Satisfactory Wiki</a> | Map data from game files'
    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    subdomains={['a', 'b', 'c', 'd']}
    maxZoom={6}
    minZoom={1}
  />
)

export function MapTab() {
  const { playerLocation, playerRotation, buildings, resourceNodes } = useTelemetryStore()
  const [mapRef, setMapRef] = useState(null)
  const [layerVisibility, setLayerVisibility] = useState({
    player: true,
    buildings: true,
    resources: true,
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapCenter, setMapCenter] = useState(gameToMap(playerLocation.x, playerLocation.y))
  const [mapZoom, setMapZoom] = useState(3)

  const playerPosition = gameToMap(playerLocation.x, playerLocation.y)

  const handleCenterPlayer = useCallback(() => {
    if (mapRef) {
      mapRef.flyTo(playerPosition, 4, { duration: 1 })
    }
    setMapCenter(playerPosition)
  }, [mapRef, playerPosition])

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Auto-center on player when position updates significantly
  useEffect(() => {
    if (layerVisibility.player && mapRef) {
      const distance = mapRef.distance(mapRef.getCenter(), L.latLng(playerPosition))
      if (distance > 5000) { // If player moved more than 5km from center
        mapRef.flyTo(playerPosition, mapRef.getZoom(), { duration: 1.5 })
      }
    }
  }, [playerPosition, layerVisibility.player, mapRef])

  return (
    <div className="relative h-full w-full">
      <MapContainer
        ref={setMapRef}
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={false}
        scrollWheelZoom={true}
        className="h-full w-full"
        onZoomEnd={(e) => setMapZoom(e.target.getZoom())}
        onMoveEnd={(e) => setMapCenter(e.target.getCenter())}
      >
        <SatisfactoryTileLayer />
        <MapEvents onCenterPlayer={handleCenterPlayer} playerPosition={playerPosition} />

        {/* Player Marker */}
        {layerVisibility.player && (
          <Marker position={playerPosition} icon={createPlayerIcon(playerRotation)}>
            <Popup>
              <div className="text-white p-1">
                <strong className="text-emerald-300">Player</strong><br />
                X: {playerLocation.x.toFixed(0)}<br />
                Y: {playerLocation.y.toFixed(0)}<br />
                Z: {playerLocation.z.toFixed(0)}<br />
                Rotation: {playerRotation.toFixed(0)}°<br />
                Biome: {playerLocation.biome || 'Unknown'}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Buildings */}
        {layerVisibility.buildings && buildings.map((building, index) => (
          <BuildingMarker key={index} building={building} />
        ))}

        {/* Resource Nodes */}
        {layerVisibility.resources && resourceNodes.map((node, index) => (
          <ResourceNodeMarker key={index} node={node} />
        ))}

        {/* Custom Map Controls */}
        <MapControls
          onCenterPlayer={handleCenterPlayer}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
        />
      </MapContainer>

      {/* Layer Toggle Panel */}
      <div className="absolute top-4 right-4 z-20 glass rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-gray-300" />
          <span className="text-sm font-medium text-white">Layers</span>
        </div>
        <div className="space-y-2">
          {[
            { key: 'player', label: 'Player', icon: Crosshair, color: 'text-emerald-400' },
            { key: 'buildings', label: 'Buildings', icon: Maximize2, color: 'text-orange-400' },
            { key: 'resources', label: 'Resources', icon: Maximize2, color: 'text-yellow-400' },
          ].map(({ key, label, icon: Icon, color }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={layerVisibility[key]}
                onChange={(e) => setLayerVisibility(prev => ({ ...prev, [key]: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
              />
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-sm text-gray-200">{label}</span>
              <span className="text-xs text-gray-500 ml-auto">
                {key === 'buildings' ? buildings.length : key === 'resources' ? resourceNodes.length : 1}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Coordinates Display */}
      <div className="absolute bottom-4 left-4 z-20 glass rounded-xl p-3 text-xs">
        <div className="flex items-center gap-2 text-gray-300">
          <Crosshair className="w-3 h-3" />
          <span>X: {playerLocation.x.toFixed(0)} Y: {playerLocation.y.toFixed(0)} Z: {playerLocation.z.toFixed(0)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300 mt-1">
          <span className="font-mono">{playerRotation.toFixed(0)}°</span>
        </div>
      </div>

      {isFullscreen && (
        <div className="absolute top-4 left-4 z-30">
          <button
            onClick={handleToggleFullscreen}
            className="glass rounded-lg p-2 hover:bg-gray-800/80 transition-colors"
            title="Exit Fullscreen"
          >
            <Minimize2 className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      )}
    </div>
  )
}