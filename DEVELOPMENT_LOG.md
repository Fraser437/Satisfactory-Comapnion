# Satisfactory Companion - Development Log

## Project Initialization - 2026-11-10

### Created Project Structure
- Initialized Vite + React + Electron + Tailwind CSS project
- Installed dependencies: @xyflow/react, react-leaflet, leaflet, lucide-react, zustand, ws, electron-builder, vite-plugin-electron, vite-plugin-electron-renderer, concurrently, wait-on

### Core Files Created
1. **package.json** - Project config with scripts (dev, build, mock, start)
2. **main.js** - Electron main process with window controls IPC
3. **preload.js** - Secure context bridge for IPC
4. **vite.config.js** - Vite config with Electron plugins
5. **tailwind.config.js** / **postcss.config.js** - Tailwind v4 config
6. **src/index.css** - Tailwind v4 imports + custom component utilities
7. **src/main.jsx** - React entry point
8. **src/App.jsx** - Main app with WebSocket manager and tab routing

### Store
- **src/store/useTelemetryStore.js** - Zustand store with:
  - Connection state management
  - Player telemetry (location, rotation, biome, health, ping)
  - Power grid state (capacity, production, consumption, tripped)
  - Log history (max 500 entries) with filtering
  - Building/resource node tracking
  - Production planner nodes/edges
  - Shopping list & custom tasks with persistence
  - Computed values (power %, progress bars)

### Components
- **src/components/Navbar.jsx** - Collapsible sidebar with tab navigation, window controls
- **src/components/StatCard.jsx** - Metric cards, PowerGauge, LocationCard
- **src/components/JSONViewer.jsx** - Syntax-highlighted collapsible JSON tree viewer

### Tabs
1. **LiveLogTab.jsx** - Connection status, power gauge, location, filterable log feed with JSON viewer
2. **MapTab.jsx** - Leaflet map with player marker, building pins, resource nodes, layer toggles
3. **PlannerTab.jsx** - React Flow planner with recipe/source/sink nodes, throughput analysis, export to shopping list
4. **TodoTab.jsx** - Two-column layout: shopping list (auto-populated) + custom tasks, progress bars, import/export
5. **SettingsTab.jsx** - WS URL config, theme toggle (dark/light/system), connection test, app info

### Mock Server
- **scripts/mock-server.cjs** - WebSocket server on port 8080 simulating:
  - PlayerTelemetry (1 sec intervals, circular movement)
  - PowerGridUpdate (3 sec intervals)
  - BuildingConstructed (15 sec intervals, 30% chance)
  - ResourceNodeFound (25 sec intervals, 20% chance)
  - Random power grid trips (2% chance every 30 sec)

### Build Status
- ✅ Production build successful (vite build)
- ⚠️ Chunk size warning (645 kB) - could be code-split later

### To Run
```bash
npm run mock        # Terminal 1: Start mock WebSocket server
npm run dev:electron # Terminal 2: Launch Electron app
```

---

## Future Changes Log

### 2026-11-10 - Initial Commit & GitHub Push
- Initialized git repository
- Committed all project files (30 files, ~9785 lines)
- Pushed to GitHub: https://github.com/Fraser437/Satisfactory-Comapnion.git
- Branch: master

<!-- Add entries below after each prompt -->