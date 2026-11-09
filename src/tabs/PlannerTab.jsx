import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MiniMap,
  Controls,
  Background,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Plus,
  Trash2,
  Download,
  Settings,
  ChevronDown,
  ChevronUp,
  Copy,
  AlertTriangle,
} from 'lucide-react'
import { useTelemetryStore } from '../store/useTelemetryStore'

// Building and recipe data
const BUILDINGS = [
  { id: 'constructor_mk1', name: 'Constructor Mk.1', power: 4, materials: [{ name: 'Iron Plate', amount: 10 }, { name: 'Iron Rod', amount: 5 }, { name: 'Concrete', amount: 2 }] },
  { id: 'assembler_mk1', name: 'Assembler Mk.1', power: 15, materials: [{ name: 'Iron Plate', amount: 25 }, { name: 'Iron Rod', amount: 20 }, { name: 'Cable', amount: 5 }, { name: 'Concrete', amount: 10 }] },
  { id: 'manufacturer_mk1', name: 'Manufacturer Mk.1', power: 55, materials: [{ name: 'Iron Plate', amount: 50 }, { name: 'Iron Rod', amount: 30 }, { name: 'Cable', amount: 20 }, { name: 'Concrete', amount: 20 }, { name: 'Modular Frame', amount: 10 }] },
  { id: 'smelter_mk1', name: 'Smelter Mk.1', power: 4, materials: [{ name: 'Iron Plate', amount: 10 }, { name: 'Iron Rod', amount: 5 }, { name: 'Concrete', amount: 2 }] },
  { id: 'foundry_mk1', name: 'Foundry Mk.1', power: 160, materials: [{ name: 'Iron Plate', amount: 100 }, { name: 'Iron Rod', amount: 50 }, { name: 'Cable', amount: 25 }, { name: 'Concrete', amount: 50 }, { name: 'Modular Frame', amount: 20 }] },
  { id: 'refinery_mk1', name: 'Refinery Mk.1', power: 30, materials: [{ name: 'Iron Plate', amount: 20 }, { name: 'Iron Rod', amount: 15 }, { name: 'Cable', amount: 10 }, { name: 'Concrete', amount: 25 }] },
  { id: 'blender_mk1', name: 'Blender Mk.1', power: 75, materials: [{ name: 'Iron Plate', amount: 30 }, { name: 'Iron Rod', amount: 20 }, { name: 'Cable', amount: 15 }, { name: 'Concrete', amount: 20 }] },
  { id: 'packager_mk1', name: 'Packager Mk.1', power: 10, materials: [{ name: 'Iron Plate', amount: 15 }, { name: 'Iron Rod', amount: 10 }, { name: 'Cable', amount: 5 }, { name: 'Concrete', amount: 5 }] },
  { id: 'miner_mk1', name: 'Miner Mk.1', power: 5, materials: [{ name: 'Iron Plate', amount: 10 }, { name: 'Iron Rod', amount: 5 }, { name: 'Concrete', amount: 5 }] },
  { id: 'water_extractor', name: 'Water Extractor', power: 20, materials: [{ name: 'Iron Plate', amount: 20 }, { name: 'Iron Rod', amount: 10 }, { name: 'Cable', amount: 5 }, { name: 'Concrete', amount: 20 }] },
  { id: 'oil_extractor', name: 'Oil Extractor', power: 50, materials: [{ name: 'Iron Plate', amount: 30 }, { name: 'Iron Rod', amount: 20 }, { name: 'Cable', amount: 10 }, { name: 'Concrete', amount: 30 }] },
  { id: 'generator_coal', name: 'Coal Generator', power: 0, materials: [{ name: 'Iron Plate', amount: 15 }, { name: 'Iron Rod', amount: 10 }, { name: 'Cable', amount: 5 }, { name: 'Concrete', amount: 25 }] },
  { id: 'generator_fuel', name: 'Fuel Generator', power: 0, materials: [{ name: 'Iron Plate', amount: 25 }, { name: 'Iron Rod', amount: 15 }, { name: 'Cable', amount: 10 }, { name: 'Concrete', amount: 30 }] },
  { id: 'generator_nuclear', name: 'Nuclear Power Plant', power: 0, materials: [{ name: 'Iron Plate', amount: 100 }, { name: 'Iron Rod', amount: 50 }, { name: 'Cable', amount: 50 }, { name: 'Concrete', amount: 200 }, { name: 'Modular Frame', amount: 20 }] },
]

const RECIPES = {
  constructor_mk1: [
    { id: 'iron_plate', name: 'Iron Plate', inputs: [{ item: 'Iron Ingot', rate: 30 }], outputs: [{ item: 'Iron Plate', rate: 20 }] },
    { id: 'iron_rod', name: 'Iron Rod', inputs: [{ item: 'Iron Ingot', rate: 15 }], outputs: [{ item: 'Iron Rod', rate: 15 }] },
    { id: 'copper_sheet', name: 'Copper Sheet', inputs: [{ item: 'Copper Ingot', rate: 20 }], outputs: [{ item: 'Copper Sheet', rate: 10 }] },
    { id: 'wire', name: 'Wire', inputs: [{ item: 'Copper Ingot', rate: 15 }], outputs: [{ item: 'Wire', rate: 30 }] },
    { id: 'concrete', name: 'Concrete', inputs: [{ item: 'Limestone', rate: 45 }], outputs: [{ item: 'Concrete', rate: 15 }] },
    { id: 'screw', name: 'Screw', inputs: [{ item: 'Iron Rod', rate: 10 }], outputs: [{ item: 'Screw', rate: 40 }] },
  ],
  assembler_mk1: [
    { id: 'reinforced_iron_plate', name: 'Reinforced Iron Plate', inputs: [{ item: 'Iron Plate', rate: 30 }, { item: 'Screw', rate: 60 }], outputs: [{ item: 'Reinforced Iron Plate', rate: 5 }] },
    { id: 'rotor', name: 'Rotor', inputs: [{ item: 'Iron Rod', rate: 20 }, { item: 'Screw', rate: 50 }], outputs: [{ item: 'Rotor', rate: 4 }] },
    { id: 'modular_frame', name: 'Modular Frame', inputs: [{ item: 'Reinforced Iron Plate', rate: 10 }, { item: 'Iron Rod', rate: 12 }], outputs: [{ item: 'Modular Frame', rate: 2 }] },
    { id: 'smart_plating', name: 'Smart Plating', inputs: [{ item: 'Reinforced Iron Plate', rate: 10 }, { item: 'Rotor', rate: 8 }], outputs: [{ item: 'Smart Plating', rate: 2 }] },
    { id: 'motor', name: 'Motor', inputs: [{ item: 'Rotor', rate: 10 }, { item: 'Stator', rate: 10 }], outputs: [{ item: 'Motor', rate: 4 }] },
    { id: 'stator', name: 'Stator', inputs: [{ item: 'Iron Rod', rate: 15 }, { item: 'Wire', rate: 40 }], outputs: [{ item: 'Stator', rate: 5 }] },
  ],
  manufacturer_mk1: [
    { id: 'versatile_framework', name: 'Versatile Framework', inputs: [{ item: 'Modular Frame', rate: 5 }, { item: 'Steel Beam', rate: 15 }], outputs: [{ item: 'Versatile Framework', rate: 1 }] },
    { id: 'automated_wiring', name: 'Automated Wiring', inputs: [{ item: 'Stator', rate: 12.5 }, { item: 'Cable', rate: 30 }], outputs: [{ item: 'Automated Wiring', rate: 2.5 }] },
    { id: 'circuit_board', name: 'Circuit Board', inputs: [{ item: 'Cable', rate: 20 }, { item: 'Plastic', rate: 10 }], outputs: [{ item: 'Circuit Board', rate: 2.5 }] },
    { id: 'heavy_modular_frame', name: 'Heavy Modular Frame', inputs: [{ item: 'Modular Frame', rate: 2 }, { item: 'Steel Pipe', rate: 12 }], outputs: [{ item: 'Heavy Modular Frame', rate: 1 }] },
    { id: 'computer', name: 'Computer', inputs: [{ item: 'Circuit Board', rate: 5 }, { item: 'Cable', rate: 20 }, { item: 'Plastic', rate: 10 }], outputs: [{ item: 'Computer', rate: 1 }] },
    { id: 'crystal_oscillator', name: 'Crystal Oscillator', inputs: [{ item: 'Quartz Crystal', rate: 13 }, { item: 'Cable', rate: 26 }, { item: 'Reinforced Iron Plate', rate: 6.5 }], outputs: [{ item: 'Crystal Oscillator', rate: 1.5 }] },
  ],
  smelter_mk1: [
    { id: 'iron_ingot', name: 'Iron Ingot', inputs: [{ item: 'Iron Ore', rate: 30 }], outputs: [{ item: 'Iron Ingot', rate: 30 }] },
    { id: 'copper_ingot', name: 'Copper Ingot', inputs: [{ item: 'Copper Ore', rate: 30 }], outputs: [{ item: 'Copper Ingot', rate: 30 }] },
    { id: 'steel_ingot', name: 'Steel Ingot', inputs: [{ item: 'Iron Ore', rate: 45 }, { item: 'Coal', rate: 45 }], outputs: [{ item: 'Steel Ingot', rate: 30 }] },
    { id: 'aluminum_solution', name: 'Aluminum Solution', inputs: [{ item: 'Bauxite', rate: 60 }, { item: 'Water', rate: 120 }], outputs: [{ item: 'Aluminum Solution', rate: 60 }] },
  ],
  foundry_mk1: [
    { id: 'steel_ingot_foundry', name: 'Steel Ingot (Foundry)', inputs: [{ item: 'Iron Ore', rate: 60 }, { item: 'Coal', rate: 60 }], outputs: [{ item: 'Steel Ingot', rate: 60 }] },
    { id: 'aluminum_ingot', name: 'Aluminum Ingot', inputs: [{ item: 'Aluminum Solution', rate: 60 }], outputs: [{ item: 'Aluminum Ingot', rate: 30 }] },
    { id: 'alclad_aluminum_sheet', name: 'Alclad Aluminum Sheet', inputs: [{ item: 'Aluminum Ingot', rate: 30 }, { item: 'Copper Ingot', rate: 10 }], outputs: [{ item: 'Alclad Aluminum Sheet', rate: 20 }] },
  ],
  refinery_mk1: [
    { id: 'polymer_resin', name: 'Polymer Resin', inputs: [{ item: 'Heavy Oil Residue', rate: 30 }], outputs: [{ item: 'Polymer Resin', rate: 20 }] },
    { id: 'rubber', name: 'Rubber', inputs: [{ item: 'Polymer Resin', rate: 20 }, { item: 'Water', rate: 40 }], outputs: [{ item: 'Rubber', rate: 20 }] },
    { id: 'plastic', name: 'Plastic', inputs: [{ item: 'Polymer Resin', rate: 30 }, { item: 'Water', rate: 30 }], outputs: [{ item: 'Plastic', rate: 20 }] },
    { id: 'fuel', name: 'Fuel', inputs: [{ item: 'Heavy Oil Residue', rate: 40 }, { item: 'Polymer Resin', rate: 20 }], outputs: [{ item: 'Fuel', rate: 30 }] },
    { id: 'alumina_solution', name: 'Alumina Solution', inputs: [{ item: 'Bauxite', rate: 60 }, { item: 'Water', rate: 120 }], outputs: [{ item: 'Alumina Solution', rate: 60 }] },
  ],
  blender_mk1: [
    { id: 'solid_biofuel', name: 'Solid Biofuel', inputs: [{ item: 'Biomass', rate: 30 }], outputs: [{ item: 'Solid Biofuel', rate: 25 }] },
    { id: 'biomass_leaves', name: 'Biomass (Leaves)', inputs: [{ item: 'Leaves', rate: 100 }], outputs: [{ item: 'Biomass', rate: 50 }] },
    { id: 'biomass_wood', name: 'Biomass (Wood)', inputs: [{ item: 'Wood', rate: 50 }], outputs: [{ item: 'Biomass', rate: 25 }] },
    { id: 'biomass_alien', name: 'Biomass (Alien)', inputs: [{ item: 'Alien Protein', rate: 20 }], outputs: [{ item: 'Biomass', rate: 10 }] },
    { id: 'color_cartridge', name: 'Color Cartridge', inputs: [{ item: 'Mycelia', rate: 30 }, { item: 'Water', rate: 60 }], outputs: [{ item: 'Color Cartridge', rate: 20 }] },
  ],
  packager_mk1: [
    { id: 'package_fuel', name: 'Packaged Fuel', inputs: [{ item: 'Fuel', rate: 60 }, { item: 'Empty Canister', rate: 60 }], outputs: [{ item: 'Packaged Fuel', rate: 60 }] },
    { id: 'package_water', name: 'Packaged Water', inputs: [{ item: 'Water', rate: 120 }, { item: 'Empty Canister', rate: 120 }], outputs: [{ item: 'Packaged Water', rate: 120 }] },
    { id: 'package_alumina', name: 'Packaged Alumina Solution', inputs: [{ item: 'Alumina Solution', rate: 60 }, { item: 'Empty Canister', rate: 60 }], outputs: [{ item: 'Packaged Alumina Solution', rate: 60 }] },
    { id: 'package_nitrogen', name: 'Packaged Nitrogen Gas', inputs: [{ item: 'Nitrogen Gas', rate: 100 }, { item: 'Empty Canister', rate: 100 }], outputs: [{ item: 'Packaged Nitrogen Gas', rate: 100 }] },
    { id: 'empty_canister', name: 'Empty Canister', inputs: [{ item: 'Iron Plate', rate: 10 }], outputs: [{ item: 'Empty Canister', rate: 20 }] },
  ],
  miner_mk1: [
    { id: 'mine_iron', name: 'Iron Ore', inputs: [], outputs: [{ item: 'Iron Ore', rate: 60 }] },
    { id: 'mine_copper', name: 'Copper Ore', inputs: [], outputs: [{ item: 'Copper Ore', rate: 60 }] },
    { id: 'mine_limestone', name: 'Limestone', inputs: [], outputs: [{ item: 'Limestone', rate: 60 }] },
    { id: 'mine_coal', name: 'Coal', inputs: [], outputs: [{ item: 'Coal', rate: 60 }] },
    { id: 'mine_caterium', name: 'Caterium Ore', inputs: [], outputs: [{ item: 'Caterium Ore', rate: 60 }] },
    { id: 'mine_quartz', name: 'Raw Quartz', inputs: [], outputs: [{ item: 'Raw Quartz', rate: 60 }] },
    { id: 'mine_sulfur', name: 'Sulfur', inputs: [], outputs: [{ item: 'Sulfur', rate: 60 }] },
    { id: 'mine_bauxite', name: 'Bauxite', inputs: [], outputs: [{ item: 'Bauxite', rate: 60 }] },
    { id: 'mine_uranium', name: 'Uranium', inputs: [], outputs: [{ item: 'Uranium', rate: 60 }] },
  ],
  water_extractor: [
    { id: 'extract_water', name: 'Water', inputs: [], outputs: [{ item: 'Water', rate: 120 }] },
  ],
  oil_extractor: [
    { id: 'extract_oil', name: 'Crude Oil', inputs: [], outputs: [{ item: 'Crude Oil', rate: 60 }] },
  ],
  generator_coal: [
    { id: 'burn_coal', name: 'Coal Power', inputs: [{ item: 'Coal', rate: 15 }, { item: 'Water', rate: 45 }], outputs: [{ item: 'Power', rate: 75 }] },
    { id: 'burn_compacted_coal', name: 'Compacted Coal Power', inputs: [{ item: 'Compacted Coal', rate: 7.5 }, { item: 'Water', rate: 22.5 }], outputs: [{ item: 'Power', rate: 75 }] },
  ],
  generator_fuel: [
    { id: 'burn_fuel', name: 'Fuel Power', inputs: [{ item: 'Fuel', rate: 20 }, { item: 'Water', rate: 10 }], outputs: [{ item: 'Power', rate: 250 }] },
    { id: 'burn_turbofuel', name: 'Turbofuel Power', inputs: [{ item: 'Turbofuel', rate: 10 }, { item: 'Water', rate: 5 }], outputs: [{ item: 'Power', rate: 250 }] },
  ],
  generator_nuclear: [
    { id: 'nuclear_power', name: 'Nuclear Power', inputs: [{ item: 'Uranium Fuel Rod', rate: 1 }, { item: 'Water', rate: 300 }], outputs: [{ item: 'Power', rate: 2500 }] },
    { id: 'nuclear_waste', name: 'Nuclear Waste', inputs: [{ item: 'Uranium Fuel Rod', rate: 1 }], outputs: [{ item: 'Nuclear Waste', rate: 1 }] },
  ],
}

const RAW_RESOURCES = [
  { id: 'iron_ore', name: 'Iron Ore', category: 'ore', color: '#b87333' },
  { id: 'copper_ore', name: 'Copper Ore', category: 'ore', color: '#cd7f32' },
  { id: 'limestone', name: 'Limestone', category: 'ore', color: '#a8a8a8' },
  { id: 'coal', name: 'Coal', category: 'ore', color: '#2d2d2d' },
  { id: 'caterium_ore', name: 'Caterium Ore', category: 'ore', color: '#daa520' },
  { id: 'raw_quartz', name: 'Raw Quartz', category: 'ore', color: '#e6e6fa' },
  { id: 'sulfur', name: 'Sulfur', category: 'ore', color: '#ffdd00' },
  { id: 'bauxite', name: 'Bauxite', category: 'ore', color: '#dd5522' },
  { id: 'uranium', name: 'Uranium', category: 'ore', color: '#7fff00' },
  { id: 'water', name: 'Water', category: 'fluid', color: '#0066cc' },
  { id: 'crude_oil', name: 'Crude Oil', category: 'fluid', color: '#1a1a1a' },
  { id: 'nitrogen_gas', name: 'Nitrogen Gas', category: 'gas', color: '#7fffd4' },
]

// Custom Node Components
function RecipeNode({ data }) {
  const { building, recipe, count = 1, selected } = data
  const recipes = RECIPES[building?.id] || []
  const currentRecipe = recipes.find(r => r.id === recipe?.id)

  return (
    <div
      className={`recipe-node bg-gray-900 border-2 rounded-xl p-3 min-w-[280px] transition-all ${selected ? 'border-emerald-400 shadow-[0_0_0_1px_rgb(0_212_170)]' : 'border-gray-700'}`}
      style={{ width: '300px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <Settings className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-white text-sm">{building?.name || 'Select Building'}</p>
            <p className="text-xs text-gray-500">{count}x</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => data.onCountChange?.(count - 1)}
            disabled={count <= 1}
            className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <span className="w-8 text-center text-sm font-mono text-white">{count}</span>
          <button
            onClick={() => data.onCountChange?.(count + 1)}
            className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Building Selector */}
      <select
        value={building?.id || ''}
        onChange={(e) => data.onBuildingChange?.(BUILDINGS.find(b => b.id === e.target.value))}
        className="select-field mb-3 text-sm"
      >
        <option value="">Select Building...</option>
        {BUILDINGS.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      {/* Recipe Selector */}
      {building && recipes.length > 0 && (
        <select
          value={recipe?.id || ''}
          onChange={(e) => data.onRecipeChange?.(recipes.find(r => r.id === e.target.value))}
          className="select-field mb-3 text-sm"
        >
          <option value="">Select Recipe...</option>
          {recipes.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      )}

      {/* Inputs/Outputs */}
      {currentRecipe && (
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Inputs (per min)</p>
            <div className="space-y-1">
              {currentRecipe.inputs.map((input, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Handle
                    type="target"
                    position={Position.Left}
                    className="input-handle"
                    id={`input-${input.item}`}
                  />
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-gray-300">{input.item}</span>
                  <span className="font-mono text-red-400 ml-auto">{input.rate * count}/min</span>
                </div>
              ))}
              {currentRecipe.inputs.length === 0 && (
                <p className="text-xs text-gray-500 italic">No inputs (raw resource)</p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Outputs (per min)</p>
            <div className="space-y-1">
              {currentRecipe.outputs.map((output, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Handle
                    type="source"
                    position={Position.Right}
                    className="output-handle"
                    id={`output-${output.item}`}
                  />
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-gray-300">{output.item}</span>
                  <span className="font-mono text-emerald-400 ml-auto">{output.rate * count}/min</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Power */}
      {building && (
        <div className="mt-3 pt-2 border-t border-gray-800 flex items-center justify-between text-sm">
          <span className="text-gray-500">Power</span>
          <span className="font-mono text-yellow-400">{building.power * count} MW</span>
        </div>
      )}
    </div>
  )
}

function SourceNode({ data }) {
  const { item, rate = 0 } = data

  return (
    <div className="source-node bg-gray-900 border-2 border-gray-700 rounded-xl p-3 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center" style={{ borderColor: item.color }}>
          <Plus className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-white text-sm">{item.name}</p>
          <p className="text-xs text-gray-500">Resource Source</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Rate/min:</label>
        <input
          type="number"
          value={rate}
          onChange={(e) => data.onRateChange?.(Number(e.target.value))}
          className="input-field text-sm w-24"
          min="0"
          step="10"
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="output-handle"
        id={`source-${item.id}`}
      />
    </div>
  )
}

function SinkNode({ data }) {
  const { item } = data

  return (
    <div className="sink-node bg-gray-900 border-2 border-gray-700 rounded-xl p-3 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center" style={{ borderColor: item.color }}>
          <Trash2 className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-white text-sm">{item.name}</p>
          <p className="text-xs text-gray-500">Resource Sink</p>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="input-handle"
        id={`sink-${item.id}`}
      />
    </div>
  )
}

const nodeTypes = {
  recipe: RecipeNode,
  source: SourceNode,
  sink: SinkNode,
}

const edgeTypes = {}

// Custom Edge with flow animation
function AnimatedEdge({ id, sourceX, sourceY, targetX, targetY, style, ...rest }) {
  return (
    <path
      id={id}
      d={`M${sourceX},${sourceY} C${(sourceX + targetX) / 2},${sourceY} ${(sourceX + targetX) / 2},${targetY} ${targetX},${targetY}`}
      style={{
        ...style,
        stroke: '#4a4a4a',
        strokeWidth: 2,
        fill: 'none',
        pointerEvents: 'stroke',
      }}
      {...rest}
    />
  )
}

export function PlannerTab() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const { exportPlannerToShoppingList } = useTelemetryStore()
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [addMenuPosition, setAddMenuPosition] = useState({ x: 0, y: 0 })

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, type: 'animated', animated: true }, eds))
  }, [setEdges])

  const addRecipeNode = useCallback((position) => {
    const newNode = {
      id: `recipe-${Date.now()}`,
      type: 'recipe',
      position,
      data: {
        building: null,
        recipe: null,
        count: 1,
        onBuildingChange: (building) => {
          setNodes((nds) => nds.map(n =>
            n.id === newNode.id ? { ...n, data: { ...n.data, building, recipe: null } } : n
          ))
        },
        onRecipeChange: (recipe) => {
          setNodes((nds) => nds.map(n =>
            n.id === newNode.id ? { ...n, data: { ...n.data, recipe } } : n
          ))
        },
        onCountChange: (count) => {
          setNodes((nds) => nds.map(n =>
            n.id === newNode.id ? { ...n, data: { ...n.data, count: Math.max(1, count) } } : n
          ))
        },
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  const addSourceNode = useCallback((position, item) => {
    const newNode = {
      id: `source-${item.id}-${Date.now()}`,
      type: 'source',
      position,
      data: {
        item,
        rate: 0,
        onRateChange: (rate) => {
          setNodes((nds) => nds.map(n =>
            n.id === newNode.id ? { ...n, data: { ...n.data, rate } } : n
          ))
        },
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  const addSinkNode = useCallback((position, item) => {
    const newNode = {
      id: `sink-${item.id}-${Date.now()}`,
      type: 'sink',
      position,
      data: { item },
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  const handlePaneClick = (event) => {
    const reactFlowBounds = event.currentTarget.getBoundingClientRect()
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    }
    setAddMenuPosition(position)
    setShowAddMenu(true)
  }

  const handleExport = () => {
    const items = exportPlannerToShoppingList()
    alert(`Exported ${items.length} items to Shopping List!`)
  }

  // Calculate throughput analysis
  const throughputAnalysis = useMemo(() => {
    const analysis = {}
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source)
      const targetNode = nodes.find(n => n.id === edge.target)
      if (sourceNode?.data?.recipe?.outputs && targetNode?.data?.recipe?.inputs) {
        const sourceOutput = sourceNode.data.recipe.outputs.find(o => o.item === edge.sourceHandle?.replace('output-', ''))
        const targetInput = targetNode.data.recipe.inputs.find(i => i.item === edge.targetHandle?.replace('input-', ''))
        if (sourceOutput && targetInput) {
          const sourceRate = sourceOutput.rate * (sourceNode.data.count || 1)
          const targetRate = targetInput.rate * (targetNode.data.count || 1)
          const ratio = sourceRate / targetRate
          analysis[edge.id] = { ratio, sourceRate, targetRate, balanced: ratio >= 0.95 && ratio <= 1.05 }
        }
      }
    })
    return analysis
  }, [nodes, edges])

  return (
    <div className="h-full w-full flex flex-col bg-gray-950">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Production Planner</h2>
          <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">
            {nodes.filter(n => n.type === 'recipe').length} buildings
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="btn-primary flex items-center gap-2"
            disabled={nodes.length === 0}
          >
            <Download className="w-4 h-4" />
            Export to Shopping List
          </button>

          <div className="relative">
            <button
              onClick={() => {
                const rect = event.currentTarget.getBoundingClientRect()
                setAddMenuPosition({ x: rect.left, y: rect.bottom + 4 })
                setShowAddMenu(true)
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Node
            </button>

            {showAddMenu && (
              <div
                className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-2 w-56 z-50"
                style={{ minWidth: '220px' }}
              >
                <p className="px-3 py-2 text-xs text-gray-400 uppercase tracking-wider">Recipe Nodes</p>
                {BUILDINGS.map(building => (
                  <button
                    key={building.id}
                    onClick={() => {
                      addRecipeNode(addMenuPosition)
                      setShowAddMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800"
                  >
                    {building.name}
                  </button>
                ))}
                <hr className="border-gray-700 my-2" />
                <p className="px-3 py-2 text-xs text-gray-400 uppercase tracking-wider">Resource Sources</p>
                {RAW_RESOURCES.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      addSourceNode(addMenuPosition, item)
                      setShowAddMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 relative" onClick={handlePaneClick}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={{ ...edgeTypes, animated: AnimatedEdge }}
          fitView
          attributionPosition="bottom-left"
        >
          <Background
            color="#2a2a2a"
            gap={16}
            size={1}
            style={{ opacity: 0.3 }}
          />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'recipe') return '#6366f1'
              if (node.type === 'source') return '#22c55e'
              if (node.type === 'sink') return '#ef4444'
              return '#666'
            }}
            maskColor="rgba(13, 13, 13, 0.9)"
          />
        </ReactFlow>

        {/* Throughput warnings */}
        {Object.entries(throughputAnalysis).some(([, v]) => !v.balanced) && (
          <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-1">
            {Object.entries(throughputAnalysis)
              .filter(([, v]) => !v.balanced)
              .map(([edgeId, analysis]) => (
                <div
                  key={edgeId}
                  className="glass rounded-lg p-3 flex items-center gap-3 animate-slide-in"
                >
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-yellow-300 font-medium">Throughput Mismatch</p>
                    <p className="text-gray-300">
                      Source: {analysis.sourceRate.toFixed(1)}/min → Target: {analysis.targetRate.toFixed(1)}/min
                      ({((analysis.ratio - 1) * 100).toFixed(0)}% {analysis.ratio > 1 ? 'excess' : 'deficit'})
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-8">
            <Plus className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">No nodes yet</p>
            <p className="text-sm mt-1">Click "Add Node" or right-click to start planning</p>
          </div>
        )}
      </div>
    </div>
  )
}