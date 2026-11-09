# Satisfactory Mod Integration Specification

## Overview
This document describes the WebSocket protocol and integration requirements for a Satisfactory mod to communicate with the **Satisfactory Companion Dashboard** (Electron + React app).

The companion app connects to `ws://127.0.0.1:8080` and expects line-delimited JSON messages matching the schemas below.

---

## WebSocket Connection

### Endpoint
```
ws://127.0.0.1:8080
```

### Protocol
- **Transport**: WebSocket (RFC 6455)
- **Message Format**: Line-delimited JSON (each message ends with `\n`)
- **Encoding**: UTF-8
- **Reconnection**: Client auto-reconnects with exponential backoff (max 10 attempts)

### Base Message Schema
All messages follow this structure:
```json
{
  "timestamp": "2026-11-10T08:50:00Z",
  "event": "<EventName>",
  "data": {}
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | string (ISO 8601) | Yes | UTC timestamp when event occurred |
| `event` | string | Yes | Event type identifier |
| `data` | object | Yes | Event-specific payload |

---

## Required Events

### 1. PlayerTelemetry
Sent periodically (recommended: 1 Hz) to update player position and status.

```json
{
  "timestamp": "2026-11-10T08:50:00Z",
  "event": "PlayerTelemetry",
  "data": {
    "location": { "x": 125000.5, "y": -45000.2, "z": 3200.0 },
    "rotation": 180.0,
    "biome": "Grass Fields",
    "health": 100.0,
    "ping": 12
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `location.x` | number | World X coordinate (East/West) |
| `location.y` | number | World Y coordinate (North/South) |
| `location.z` | number | World Z coordinate (height) |
| `rotation` | number | Yaw rotation in degrees (0-360) |
| `biome` | string | Current biome name |
| `health` | number | Player health (0-100) |
| `ping` | number | Network latency in ms |

**Coordinate System Notes:**
- Satisfactory uses Unreal Engine coordinates (cm)
- X: East (+) / West (-)
- Y: North (+) / South (-) 
- Z: Up (+) / Down (-)
- Origin (0,0,0) is roughly center of map

---

### 2. PowerGridUpdate
Sent when power grid values change (recommended: 2-5 Hz or on change).

```json
{
  "timestamp": "2026-11-10T08:50:05Z",
  "event": "PowerGridUpdate",
  "data": {
    "circuit_id": 1,
    "capacity_mw": 5000.0,
    "production_mw": 3450.2,
    "consumption_mw": 3200.8,
    "is_tripped": false
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `circuit_id` | number | Power circuit identifier (usually 1) |
| `capacity_mw` | number | Maximum power capacity in MW |
| `production_mw` | number | Current power production in MW |
| `consumption_mw` | number | Current power consumption in MW |
| `is_tripped` | boolean | True if grid exceeded capacity |

**Trip Detection:** When `consumption_mw > capacity_mw`, set `is_tripped: true`. The app will show a warning.

---

### 3. BuildingConstructed
Sent when a new building is placed/constructed.

```json
{
  "timestamp": "2026-11-10T08:51:12Z",
  "event": "BuildingConstructed",
  "data": {
    "building_id": "Build_ConstructorMK1_C",
    "name": "Constructor Mk.1",
    "location": { "x": 125100.0, "y": -44900.0, "z": 3200.0 },
    "recipe": "Recipe_IronPlate_C"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `building_id` | string | Internal class name (e.g., `Build_ConstructorMK1_C`) |
| `name` | string | Display name |
| `location` | object | World coordinates (same format as PlayerTelemetry) |
| `recipe` | string | Current recipe class name (optional) |

**Common Building IDs:**
- `Build_ConstructorMK1_C` / `Build_ConstructorMK2_C` / `Build_ConstructorMK3_C`
- `Build_AssemblerMK1_C` / `Build_AssemblerMK2_C` / `Build_AssemblerMK3_C`
- `Build_ManufacturerMK1_C` / `Build_ManufacturerMK2_C` / `Build_ManufacturerMK3_C`
- `Build_SmelterMK1_C` / `Build_SmelterMK2_C`
- `Build_FoundryMK1_C` / `Build_FoundryMK2_C`
- `Build_RefineryMK1_C`
- `Build_BlenderMK1_C`
- `Build_PackagerMK1_C`
- `Build_MinerMK1_C` / `Build_MinerMK2_C` / `Build_MinerMK3_C`
- `Build_WaterExtractor_C`
- `Build_OilExtractor_C`
- `Build_GeneratorCoal_C` / `Build_GeneratorFuel_C` / `Build_GeneratorNuclear_C`

---

### 4. ResourceNodeFound (Optional)
Sent when a resource node is discovered/scanned.

```json
{
  "timestamp": "2026-11-10T08:52:00Z",
  "event": "ResourceNodeFound",
  "data": {
    "type": "Iron Ore",
    "purity": "Pure",
    "location": { "x": 130000.0, "y": -50000.0, "z": 3100.0 }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Resource type (Iron Ore, Copper Ore, Limestone, Coal, Caterium Ore, Raw Quartz, Sulfur, Bauxite, Uranium, Water, Crude Oil, Nitrogen Gas) |
| `purity` | string | Impure / Normal / Pure |
| `location` | object | World coordinates |

---

### 5. MilestoneCompleted (Optional)
Sent when a milestone tier is unlocked.

```json
{
  "timestamp": "2026-11-10T08:55:00Z",
  "event": "MilestoneCompleted",
  "data": {
    "tier": 4,
    "name": "Advanced Steel Production"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tier` | number | Milestone tier (1-8) |
| `name` | string | Milestone display name |

---

## Mod Implementation Guide

### Unreal Engine / C++ Mod (Recommended)

#### 1. WebSocket Client Setup
Use a WebSocket library compatible with Unreal (e.g., `libwebsockets`, `IXWebSocket`, or `uWebSockets`).

```cpp
// Pseudocode for mod structure
class FSatisfactoryCompanionModule : public IModuleInterface
{
    TSharedPtr<IWebSocket> WebSocket;
    FTimerHandle TelemetryTimer;
    FTimerHandle PowerGridTimer;
    
    virtual void StartupModule() override
    {
        ConnectWebSocket();
        StartTimers();
    }
    
    void ConnectWebSocket()
    {
        WebSocket = FWebSocketsModule::Get().CreateWebSocket("ws://127.0.0.1:8080");
        WebSocket->OnConnected().AddLambda([this]() {
            UE_LOG(LogTemp, Log, TEXT("Connected to Companion App"));
        });
        WebSocket->OnConnectionError().AddLambda([this](const FString& Error) {
            UE_LOG(LogTemp, Error, TEXT("WS Error: %s"), *Error);
            // Schedule reconnect
        });
        WebSocket->Connect();
    }
    
    void SendEvent(const FString& EventName, TSharedPtr<FJsonObject> Data)
    {
        if (!WebSocket.IsValid() || WebSocket->GetConnectionState() != EWebSocketConnectionState::Connected)
            return;
            
        TSharedPtr<FJsonObject> Message = MakeShareable(new FJsonObject);
        Message->SetStringField("timestamp", FDateTime::UtcNow().ToIso8601());
        Message->SetStringField("event", EventName);
        Message->SetObjectField("data", Data);
        
        FString Output;
        TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&Output);
        FJsonSerializer::Serialize(Message.ToSharedRef(), Writer);
        
        WebSocket->Send(Output + "\n"); // Line-delimited
    }
};
```

#### 2. Player Telemetry (1 Hz Timer)
```cpp
void SendPlayerTelemetry()
{
    APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    if (!PC || !PC->GetPawn()) return;
    
    APawn* Pawn = PC->GetPawn();
    FVector Loc = Pawn->GetActorLocation(); // In cm
    FRotator Rot = Pawn->GetActorRotation();
    
    // Get biome (requires access to game's biome system)
    FString Biome = GetCurrentBiome(Loc);
    
    // Get health
    float Health = 100.0f;
    if (ACharacter* Char = Cast<ACharacter>(Pawn))
    {
        Health = (Char->GetHealth() / Char->GetMaxHealth()) * 100.0f;
    }
    
    TSharedPtr<FJsonObject> Data = MakeShareable(new FJsonObject);
    Data->SetNumberField("x", Loc.X);
    Data->SetNumberField("y", Loc.Y);
    Data->SetNumberField("z", Loc.Z);
    Data->SetNumberField("rotation", Rot.Yaw);
    Data->SetStringField("biome", Biome);
    Data->SetNumberField("health", Health);
    Data->SetNumberField("ping", GetNetworkPing());
    
    SendEvent("PlayerTelemetry", Data);
}
```

#### 3. Power Grid Monitoring
Hook into `AFGPowerCircuit` or `AFGPowerInfo` to get real-time values.

```cpp
void SendPowerGridUpdate()
{
    // Find the main power circuit (usually circuit 1)
    TArray<AActor*> Circuits;
    UGameplayStatics::GetAllActorsOfClass(GetWorld(), AFGPowerCircuit::StaticClass(), Circuits);
    
    for (AActor* Actor : Circuits)
    {
        AFGPowerCircuit* Circuit = Cast<AFGPowerCircuit>(Actor);
        if (!Circuit) continue;
        
        TSharedPtr<FJsonObject> Data = MakeShareable(new FJsonObject);
        Data->SetNumberField("circuit_id", Circuit->GetCircuitID());
        Data->SetNumberField("capacity_mw", Circuit->GetMaxCapacity() / 1000000.0); // Convert from W to MW
        Data->SetNumberField("production_mw", Circuit->GetCurrentProduction() / 1000000.0);
        Data->SetNumberField("consumption_mw", Circuit->GetCurrentConsumption() / 1000000.0);
        Data->SetBoolField("is_tripped", Circuit->IsTripped());
        
        SendEvent("PowerGridUpdate", Data);
    }
}
```

#### 4. Building Construction Detection
Listen for building placement events.

```cpp
// Hook into AFGBuildable::OnConstructionCompleted or similar
void OnBuildingConstructed(AFGBuildable* Building)
{
    if (!Building) return;
    
    FVector Loc = Building->GetActorLocation();
    FRotator Rot = Building->GetActorRotation();
    
    // Get building class name
    FString BuildingID = Building->GetClass()->GetName();
    FString DisplayName = Building->GetDisplayName().ToString();
    
    // Get current recipe (if applicable)
    FString Recipe = "";
    if (AFGBuildableManufacturer* Manufacturer = Cast<AFGBuildableManufacturer>(Building))
    {
        if (Manufacturer->GetCurrentRecipe())
        {
            Recipe = Manufacturer->GetCurrentRecipe()->GetClass()->GetName();
        }
    }
    
    TSharedPtr<FJsonObject> Data = MakeShareable(new FJsonObject);
    Data->SetStringField("building_id", BuildingID);
    Data->SetStringField("name", DisplayName);
    
    TSharedPtr<FJsonObject> LocObj = MakeShareable(new FJsonObject);
    LocObj->SetNumberField("x", Loc.X);
    LocObj->SetNumberField("y", Loc.Y);
    LocObj->SetNumberField("z", Loc.Z);
    Data->SetObjectField("location", LocObj);
    
    Data->SetStringField("recipe", Recipe);
    
    SendEvent("BuildingConstructed", Data);
}
```

#### 5. Resource Node Scanning
Use the resource scanner or listen for node discovery.

```cpp
void OnResourceNodeDiscovered(AFGResourceNode* Node)
{
    if (!Node) return;
    
    FVector Loc = Node->GetActorLocation();
    FString ResourceType = GetResourceTypeName(Node->GetResourceClass());
    FString Purity = GetPurityName(Node->GetPurity());
    
    TSharedPtr<FJsonObject> Data = MakeShareable(new FJsonObject);
    Data->SetStringField("type", ResourceType);
    Data->SetStringField("purity", Purity);
    
    TSharedPtr<FJsonObject> LocObj = MakeShareable(new FJsonObject);
    LocObj->SetNumberField("x", Loc.X);
    LocObj->SetNumberField("y", Loc.Y);
    LocObj->SetNumberField("z", Loc.Z);
    Data->SetObjectField("location", LocObj);
    
    SendEvent("ResourceNodeFound", Data);
}
```

---

## Satisfactory Mod Loader (SML) / Blueprint Mod Alternative

If using SML with Lua/Blueprint scripting:

### Lua Example (using SML's HTTP/WebSocket API)
```lua
-- Requires SML with WebSocket support
local WebSocket = require("websocket")
local ws = WebSocket.client.connect("ws://127.0.0.1:8080")

function send_event(event, data)
    local msg = {
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        event = event,
        data = data
    }
    ws:send(json.encode(msg) .. "\n")
end

-- Player telemetry timer (1 second)
timer.create("telemetry", 1, 0, function()
    local player = get_player()
    if player then
        local loc = player:get_position()
        send_event("PlayerTelemetry", {
            location = {x = loc.x, y = loc.y, z = loc.z},
            rotation = player:get_rotation().yaw,
            biome = get_biome_at(loc),
            health = player:get_health_percent() * 100,
            ping = get_ping()
        })
    end
end)

-- Power grid timer (3 seconds)
timer.create("power", 3, 0, function()
    local circuit = get_main_power_circuit()
    if circuit then
        send_event("PowerGridUpdate", {
            circuit_id = 1,
            capacity_mw = circuit.max_capacity / 1e6,
            production_mw = circuit.current_production / 1e6,
            consumption_mw = circuit.current_consumption / 1e6,
            is_tripped = circuit.is_tripped
        })
    end
end)
```

---

## Testing Without the Game

Run the included mock server to test the companion app without a mod:

```bash
cd satisfactory-companion
npm run mock
```

This starts a WebSocket server on `ws://127.0.0.1:8080` that simulates:
- Player movement (circular path)
- Power grid fluctuations
- Random building construction
- Resource node discovery
- Occasional power trips

---

## Integration Checklist

Before releasing your mod, verify:

- [ ] WebSocket connects to `ws://127.0.0.1:8080`
- [ ] Messages are line-delimited JSON (`\n` terminated)
- [ ] Timestamps are ISO 8601 UTC format
- [ ] `PlayerTelemetry` sent at ~1 Hz
- [ ] `PowerGridUpdate` sent at ~2-5 Hz or on change
- [ ] `BuildingConstructed` sent on each new building
- [ ] Coordinates use game units (cm, Unreal coordinate system)
- [ ] Mod handles WebSocket disconnection gracefully
- [ ] Mod attempts reconnection on failure
- [ ] No sensitive data transmitted (only game telemetry)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Ensure companion app is running, check firewall/antivirus |
| Messages not appearing | Verify line-delimited format (`\n`), check JSON validity |
| Coordinates wrong | Confirm using Unreal cm units, not meters |
| Power values off | Convert from Watts to MW (divide by 1,000,000) |
| Building events missing | Hook into correct construction completion event |
| High latency | Reduce timer frequency, batch events if needed |

---

## Security Considerations

- **Localhost only**: WebSocket binds to `127.0.0.1`, not accessible externally
- **No authentication**: Trusted local connection only
- **Read-only**: Mod only sends data, receives no commands
- **No file system access**: WebSocket only transmits telemetry

---

## Version Compatibility

| Companion App | Protocol Version | Notes |
|--------------|------------------|-------|
| 0.1.0+ | 1.0 | Initial release |

Future versions will maintain backward compatibility. New event types will be additive.

---

## Support

For integration questions or protocol updates, check the companion app repository:
https://github.com/Fraser437/Satisfactory-Comapnion