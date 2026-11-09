// scripts/mock-server.js
// Mock Satisfactory Telemetry Server for development
// Run with: npm run mock

const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  Mock Satisfactory Telemetry Server                       ║');
console.log('║  Listening on ws://127.0.0.1:8080                         ║');
console.log('╚══════════════════════════════════════════════════════════╝');

const BIOMES = [
  'Grass Fields',
  'Dune Desert',
  'Northern Forest',
  'Rocky Desert',
  'Swamp',
  'Red Jungle',
  'Titanium Fields',
  'Coastal Plains',
];

const BUILDINGS = [
  { id: 'Build_ConstructorMK1_C', name: 'Constructor Mk.1', recipes: ['Recipe_IronPlate_C', 'Recipe_IronRod_C', 'Recipe_CopperSheet_C', 'Recipe_Wire_C', 'Recipe_Concrete_C', 'Recipe_Screw_C'] },
  { id: 'Build_AssemblerMK1_C', name: 'Assembler Mk.1', recipes: ['Recipe_ReinforcedIronPlate_C', 'Recipe_Rotor_C', 'Recipe_ModularFrame_C', 'Recipe_SmartPlating_C', 'Recipe_Motor_C', 'Recipe_Stator_C'] },
  { id: 'Build_ManufacturerMK1_C', name: 'Manufacturer Mk.1', recipes: ['Recipe_VersatileFramework_C', 'Recipe_AutomatedWiring_C', 'Recipe_CircuitBoard_C', 'Recipe_HeavyModularFrame_C', 'Recipe_Computer_C', 'Recipe_CrystalOscillator_C'] },
  { id: 'Build_SmelterMK1_C', name: 'Smelter Mk.1', recipes: ['Recipe_IronIngot_C', 'Recipe_CopperIngot_C', 'Recipe_SteelIngot_C', 'Recipe_AluminumSolution_C'] },
  { id: 'Build_FoundryMK1_C', name: 'Foundry Mk.1', recipes: ['Recipe_SteelIngot_Foundry_C', 'Recipe_AluminumIngot_C', 'Recipe_AlcladAluminumSheet_C'] },
  { id: 'Build_RefineryMK1_C', name: 'Refinery Mk.1', recipes: ['Recipe_PolymerResin_C', 'Recipe_Rubber_C', 'Recipe_Plastic_C', 'Recipe_Fuel_C', 'Recipe_AluminaSolution_C'] },
  { id: 'Build_BlenderMK1_C', name: 'Blender Mk.1', recipes: ['Recipe_SolidBiofuel_C', 'Recipe_Biomass_Leaves_C', 'Recipe_Biomass_Wood_C', 'Recipe_ColorCartridge_C'] },
  { id: 'Build_PackagerMK1_C', name: 'Packager Mk.1', recipes: ['Recipe_PackagedFuel_C', 'Recipe_PackagedWater_C', 'Recipe_PackagedAluminaSolution_C', 'Recipe_PackagedNitrogenGas_C', 'Recipe_EmptyCanister_C'] },
];

let posX = 125000;
let posY = -45000;
let rotation = 90;
let biomeIndex = 0;
let buildingCount = 0;

function getRandomPosition() {
  // Move in a rough circle around the starting area
  const angle = Date.now() / 50000;
  const radius = 5000;
  posX = 125000 + Math.cos(angle) * radius + (Math.random() - 0.5) * 100;
  posY = -45000 + Math.sin(angle) * radius + (Math.random() - 0.5) * 100;
  rotation = (angle * 180 / Math.PI + 90) % 360;
  return { x: posX, y: posY, z: 3200 };
}

function getRandomBuilding() {
  const building = BUILDINGS[Math.floor(Math.random() * BUILDINGS.length)];
  const recipe = building.recipes[Math.floor(Math.random() * building.recipes.length)];
  buildingCount++;
  return {
    building_id: building.id,
    name: building.name,
    location: {
      x: posX + (Math.random() - 0.5) * 2000,
      y: posY + (Math.random() - 0.5) * 2000,
      z: 3200 + Math.random() * 100,
    },
    recipe: recipe,
  };
}

function getRandomResourceNode() {
  const types = ['Iron Ore', 'Copper Ore', 'Limestone', 'Coal', 'Caterium Ore', 'Raw Quartz', 'Sulfur', 'Bauxite', 'Uranium'];
  const purities = ['Impure', 'Normal', 'Pure'];
  return {
    type: types[Math.floor(Math.random() * types.length)],
    purity: purities[Math.floor(Math.random() * purities.length)],
    x: posX + (Math.random() - 0.5) * 50000,
    y: posY + (Math.random() - 0.5) * 50000,
  };
}

function broadcast(event, data) {
  const message = JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    data,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('🔌 Client connected! Total clients:', wss.clients.size);

  // Send initial state
  broadcast('PlayerTelemetry', {
    location: { x: posX, y: posY, z: 3200 },
    rotation: 90,
    biome: 'Grass Fields',
    health: 100,
    ping: 8,
  });

  broadcast('PowerGridUpdate', {
    circuit_id: 1,
    capacity_mw: 5000.0,
    production_mw: 3400,
    consumption_mw: 3100,
    is_tripped: false,
  });

  // Emit player movement loop (every 1 sec)
  const moveTimer = setInterval(() => {
    const loc = getRandomPosition();
    biomeIndex = (biomeIndex + 0.01) % BIOMES.length;

    broadcast('PlayerTelemetry', {
      location: loc,
      rotation: rotation,
      biome: BIOMES[Math.floor(biomeIndex)],
      health: 100,
      ping: Math.floor(8 + Math.random() * 20),
    });
  }, 1000);

  // Emit power grid status (every 3 sec)
  const powerTimer = setInterval(() => {
    const baseProduction = 3400;
    const baseConsumption = 3100;
    const variance = 200;

    broadcast('PowerGridUpdate', {
      circuit_id: 1,
      capacity_mw: 5000.0,
      production_mw: baseProduction + (Math.random() - 0.5) * variance,
      consumption_mw: baseConsumption + (Math.random() - 0.5) * variance,
      is_tripped: false,
    });
  }, 3000);

  // Emit building construction (every 10-30 sec)
  const buildingTimer = setInterval(() => {
    if (Math.random() < 0.3) { // 30% chance
      broadcast('BuildingConstructed', getRandomBuilding());
    }
  }, 15000);

  // Emit resource node discovery (every 20-40 sec)
  const resourceTimer = setInterval(() => {
    if (Math.random() < 0.2) { // 20% chance
      broadcast('ResourceNodeFound', getRandomResourceNode());
    }
  }, 25000);

  // Occasionally trip the power grid for demo
  const tripTimer = setInterval(() => {
    if (Math.random() < 0.02) { // 2% chance every 30 sec
      broadcast('PowerGridUpdate', {
        circuit_id: 1,
        capacity_mw: 5000.0,
        production_mw: 4800,
        consumption_mw: 5200,
        is_tripped: true,
      });
      // Auto-recover after 5 seconds
      setTimeout(() => {
        broadcast('PowerGridUpdate', {
          circuit_id: 1,
          capacity_mw: 5000.0,
          production_mw: 3400,
          consumption_mw: 3100,
          is_tripped: false,
        });
      }, 5000);
    }
  }, 30000);

  ws.on('close', () => {
    clearInterval(moveTimer);
    clearInterval(powerTimer);
    clearInterval(buildingTimer);
    clearInterval(resourceTimer);
    clearInterval(tripTimer);
    console.log('🔌 Client disconnected. Total clients:', wss.clients.size);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down mock server...');
  wss.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down mock server...');
  wss.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});