import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_LOG_ENTRIES = 500

const initialTodoState = {
  shoppingList: [],
  customTasks: [],
}

export const useTelemetryStore = create(
  persist(
    (set, get) => ({
      // Connection state
      isConnected: false,
      connectionError: null,

      // Live data
      playerLocation: { x: 0, y: 0, z: 0 },
      playerRotation: 0,
      biome: 'Unknown',
      health: 100,
      ping: 0,

      powerGrid: {
        circuit_id: 1,
        capacity_mw: 0,
        production_mw: 0,
        consumption_mw: 0,
        is_tripped: false,
      },

      // Log feed
      logHistory: [],
      selectedLogIndex: null,
      autoScroll: true,
      logFilter: '',

      // Map
      buildings: [],
      resourceNodes: [],

      // Planner
      plannerNodes: [],
      plannerEdges: [],

      // Todo & Shopping List
      shoppingList: [],
      customTasks: [],

      // Actions
      setConnected: (connected) => set({ isConnected: connected, connectionError: connected ? null : get().connectionError }),
      setConnectionError: (error) => set({ connectionError: error, isConnected: false }),

      // Player telemetry
      updatePlayerTelemetry: (data) => set({
        playerLocation: data.location,
        playerRotation: data.rotation,
        biome: data.biome,
        health: data.health,
        ping: data.ping,
      }),

      // Power grid
      updatePowerGrid: (data) => set({ powerGrid: data }),

      // Buildings
      addBuilding: (building) => set((state) => ({
        buildings: [...state.buildings, { ...building, id: building.building_id + '_' + Date.now() }],
      })),

      // Resource nodes
      addResourceNode: (node) => set((state) => ({
        resourceNodes: [...state.resourceNodes, node],
      })),

      // Log management
      addLogEntry: (entry) => set((state) => ({
        logHistory: [...state.logHistory.slice(-(MAX_LOG_ENTRIES - 1)), entry],
      })),

      setSelectedLogIndex: (index) => set({ selectedLogIndex: index, autoScroll: false }),
      setAutoScroll: (enabled) => set({ autoScroll: enabled }),
      setLogFilter: (filter) => set({ logFilter: filter }),
      clearLogs: () => set({ logHistory: [], selectedLogIndex: null }),

      // Planner
      setPlannerNodes: (nodes) => set({ plannerNodes: nodes }),
      setPlannerEdges: (edges) => set({ plannerEdges: edges }),
      addPlannerNode: (node) => set((state) => ({ plannerNodes: [...state.plannerNodes, node] })),
      updatePlannerNode: (id, data) => set((state) => ({
        plannerNodes: state.plannerNodes.map(n => n.id === id ? { ...n, ...data } : n),
      })),
      removePlannerNode: (id) => set((state) => ({
        plannerNodes: state.plannerNodes.filter(n => n.id !== id),
        plannerEdges: state.plannerEdges.filter(e => e.source !== id && e.target !== id),
      })),
      addPlannerEdge: (edge) => set((state) => ({ plannerEdges: [...state.plannerEdges, edge] })),
      removePlannerEdge: (id) => set((state) => ({
        plannerEdges: state.plannerEdges.filter(e => e.id !== id),
      })),

      // Shopping list (from planner)
      setShoppingList: (items) => set({ shoppingList: items }),
      addShoppingItem: (item) => set((state) => ({
        shoppingList: [...state.shoppingList, { ...item, id: item.id || Date.now().toString(), completed: false }],
      })),
      toggleShoppingItem: (id) => set((state) => ({
        shoppingList: state.shoppingList.map(item =>
          item.id === id ? { ...item, completed: !item.completed } : item
        ),
      })),
      removeShoppingItem: (id) => set((state) => ({
        shoppingList: state.shoppingList.filter(item => item.id !== id),
      })),
      clearShoppingList: () => set({ shoppingList: [] }),

      // Custom tasks
      setCustomTasks: (tasks) => set({ customTasks: tasks }),
      addCustomTask: (task) => set((state) => ({
        customTasks: [...state.customTasks, { ...task, id: task.id || Date.now().toString(), completed: false }],
      })),
      toggleCustomTask: (id) => set((state) => ({
        customTasks: state.customTasks.map(task =>
          task.id === id ? { ...task, completed: !task.completed } : task
        ),
      })),
      updateCustomTask: (id, data) => set((state) => ({
        customTasks: state.customTasks.map(task =>
          task.id === id ? { ...task, ...data } : task
        ),
      })),
      removeCustomTask: (id) => set((state) => ({
        customTasks: state.customTasks.filter(task => task.id !== id),
      })),
      clearCompletedTasks: () => set((state) => ({
        customTasks: state.customTasks.filter(task => !task.completed),
        shoppingList: state.shoppingList.filter(item => !item.completed),
      })),

      // Export from planner to shopping list
      exportPlannerToShoppingList: () => {
        const { plannerNodes } = get()
        const materialCounts = {}

        plannerNodes.forEach(node => {
          if (node.type === 'recipe' && node.data.building && node.data.recipe) {
            // Count buildings
            const buildingKey = `${node.data.building.name}|${node.data.recipe.name}`
            if (!materialCounts[buildingKey]) {
              materialCounts[buildingKey] = {
                type: 'building',
                name: node.data.building.name,
                recipe: node.data.recipe.name,
                count: 0,
                materials: node.data.building.materials || [],
              }
            }
            materialCounts[buildingKey].count++

            // Count materials needed for this building
            if (node.data.building.materials) {
              node.data.building.materials.forEach(mat => {
                const matKey = mat.name
                if (!materialCounts[matKey]) {
                  materialCounts[matKey] = {
                    type: 'material',
                    name: mat.name,
                    count: 0,
                    unit: mat.unit || 'pcs',
                  }
                }
                materialCounts[matKey].count += mat.amount * (node.data.count || 1)
              })
            }
          } else if (node.type === 'source' && node.data.item) {
            const itemKey = `source_${node.data.item.name}`
            if (!materialCounts[itemKey]) {
              materialCounts[itemKey] = {
                type: 'source',
                name: node.data.item.name,
                rate: node.data.rate || 0,
                count: 0,
              }
            }
            materialCounts[itemKey].count++
          }
        })

        const items = Object.values(materialCounts).map((item, index) => ({
          id: `shop_${Date.now()}_${index}`,
          ...item,
          completed: false,
        }))

        set({ shoppingList: items })
        return items
      },

      // Computed
      getFilteredLogs: () => {
        const { logHistory, logFilter } = get()
        if (!logFilter) return logHistory
        const filter = logFilter.toLowerCase()
        return logHistory.filter(entry =>
          entry.event.toLowerCase().includes(filter) ||
          JSON.stringify(entry.data).toLowerCase().includes(filter)
        )
      },

      getPowerPercentage: () => {
        const { powerGrid } = get()
        if (powerGrid.capacity_mw === 0) return 0
        return Math.min(100, (powerGrid.consumption_mw / powerGrid.capacity_mw) * 100)
      },

      getShoppingProgress: () => {
        const { shoppingList } = get()
        if (shoppingList.length === 0) return 100
        const completed = shoppingList.filter(i => i.completed).length
        return Math.round((completed / shoppingList.length) * 100)
      },

      getCustomTasksProgress: () => {
        const { customTasks } = get()
        if (customTasks.length === 0) return 100
        const completed = customTasks.filter(t => t.completed).length
        return Math.round((completed / customTasks.length) * 100)
      },
    }),
    {
      name: 'satisfactory-companion-store',
      partialize: (state) => ({
        shoppingList: state.shoppingList,
        customTasks: state.customTasks,
        plannerNodes: state.plannerNodes,
        plannerEdges: state.plannerEdges,
      }),
    }
  )
)