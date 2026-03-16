# Fleet Orchestrator - Project Context Document

---

## 1. Project Overview

Fleet Orchestrator is a **real-time intelligent public transport management system** built for Pune, India. It simulates live bus operations, predicts passenger demand, detects operational anomalies, and provides actionable recommendations to fleet operators.

The system is designed as a hackathon prototype demonstrating how AI-driven fleet orchestration can optimize urban public transport.

---

## 2. Problem Statement

Public transport systems in Indian cities face critical challenges:

- **Overcrowded buses** on high-demand routes while other buses run nearly empty
- **Unpredictable wait times** causing passenger frustration
- **Inefficient fleet allocation** with no real-time visibility into demand patterns
- **No integration between transport modes** (buses operate independently of metro disruptions)
- **Reactive operations** instead of predictive planning
- **Manual decision-making** without data-driven insights

### Objective

Build a **real-time intelligent fleet orchestration platform** that:

- Monitors live bus positions and passenger loads
- Predicts demand fluctuations before they occur
- Detects anomalies (overcrowding, delays, demand spikes)
- Recommends fleet adjustments automatically
- Integrates metro status to account for multi-modal impacts

---

## 3. System Objectives

The Fleet Orchestrator demonstrates:

| Capability | Description |
|------------|-------------|
| **Demand Prediction** | Forecast passenger demand using WMA + trend + time-of-day + event awareness |
| **Dynamic Fleet Allocation** | Deploy, rebalance, and adjust buses based on real-time conditions |
| **Multi-Modal Integration** | Factor metro disruptions into bus demand calculations |
| **Operator Decision Support** | Generate prioritized recommendations for fleet managers |
| **Real-Time Monitoring Dashboard** | Visualize live transport activity across the city |

---

## 4. Architecture Overview

The system follows a **full-stack layered architecture** with strict data flow rules:

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND DASHBOARD                        │
│         React 19 + Vite + Tailwind CSS + Leaflet            │
│          (Polls /api/dashboard every 3 seconds)              │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│              (apiRoutes.js - REST endpoints)                 │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                   CONTROLLERS                                │
│        (fleetController, metricsController)                  │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                     AI LAYER                                 │
│   (predictionEngine, alertEngine, recommendationEngine)      │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                 SIMULATION LAYER                             │
│    (busSimulator, demandSimulator, metroSimulator,           │
│     eventSimulator)                                          │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│              SYSTEM STATE LAYER                              │
│              (state/systemState.js)                          │
│          SINGLE SOURCE OF TRUTH FOR ALL DATA                 │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│    (routes.js, buses.js, depots.js, demandZones.js, metro.js)│
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Backend Folder Structure

```
backend/
├── config/
│   ├── constants.js        # Thresholds, limits, alert types, severity levels
│   └── simulationConfig.js # Timing intervals, rush hour settings, variability factors
│
├── data/
│   ├── routes.js           # 10 bus routes with GPS stops
│   ├── buses.js            # 50 buses with initial positions
│   ├── depots.js           # 4 depots with idle bus counts
│   ├── demandZones.js      # 12 city zones with demand levels
│   └── metro.js            # Purple Line metro configuration
│
├── state/
│   └── systemState.js      # Central runtime state object (routes, buses, depots,
│                           # demandZones, metro, events, alerts, recommendations, metrics, simulation)
│
├── simulation/
│   ├── busSimulator.js        # Bus movement (linear interpolation), demand-scaled boarding, zone decay
│   ├── demandSimulator.js     # Demand fluctuation with trend prediction and event multipliers
│   ├── metroSimulator.js      # Metro status changes with event persistence logic
│   ├── eventSimulator.js      # City events (concerts, sports, rain, etc.) with TTL
│   └── simulationRunner.js    # Starts all simulation loops and AI engines
│
├── ai/
│   ├── predictionEngine.js     # 4-step demand forecasting: WMA + trend + time-of-day + event
│   ├── alertEngine.js          # Anomaly detection (overcrowded bus/route, demand spike, metro disruption)
│   └── recommendationEngine.js # 9-type fleet optimization suggestions with geospatial route analysis
│
├── controllers/
│   ├── fleetController.js  # Bus deployment, rebalancing, query helpers
│   └── metricsController.js# KPI calculations and analytics accessors
│
├── routes/
│   └── apiRoutes.js        # REST API endpoint definitions (GET + POST)
│
├── utils/
│   ├── geoUtils.js         # Haversine distance, interpolation, proximity checks, route length
│   ├── randomGenerator.js  # randomInt, randomFloat, randomChance, weightedRandom, gaussianRandom
│   └── timeUtils.js        # Rush hour detection, night time check, time period labels
│
└── server.js               # Express server entry point (port 5000)
```

---

## 5b. Frontend Folder Structure

```
frontend/
├── public/
│   └── vite.svg                # Favicon
│
├── src/
│   ├── assets/
│   │   └── react.svg
│   │
│   ├── components/
│   │   ├── AIAssistant.jsx         # Floating AI chat drawer (mock responses)
│   │   ├── AlertsSidebar.jsx       # Alert feed with severity styling & acknowledge
│   │   ├── BusTransition.jsx       # Animated bus page-transition overlay
│   │   ├── DashboardLayout.jsx     # Generic layout: sidebar + topbar + content
│   │   ├── KPICard.jsx             # Reusable metric card (icon, value, unit)
│   │   ├── LiveMap.jsx             # Leaflet map: buses, routes, depots, demand zones
│   │   ├── MainLayout.jsx          # Root layout: sidebar nav + AI assistant
│   │   ├── RecommendationsSidebar.jsx # AI recommendation cards with deploy actions
│   │   └── SidebarNavigation.jsx   # Icon-based left navigation bar
│   │
│   ├── context/
│   │   └── FleetContext.jsx        # React Context: polls /api/dashboard every 3s
│   │
│   ├── hooks/
│   │   └── useFleetData.js         # Custom hook for dashboard polling (alternative)
│   │
│   ├── services/
│   │   └── api.js                  # Axios client: all GET & POST API calls
│   │
│   ├── views/
│   │   ├── LiveOps.jsx             # Live map + KPI ribbon + alerts sidebar
│   │   ├── StrategicOverview.jsx   # KPI cards + ridership chart + peak zones
│   │   ├── OperationalControl.jsx  # AI recommendations + anomalies + command log
│   │   ├── Analytics.jsx           # Ridership trends + mode share + depot charts
│   │   ├── MultiModal.jsx          # Metro line visual + hub connectivity table
│   │   └── FleetManagement.jsx     # Bus fleet table with search, sort, filters
│   │
│   ├── App.jsx                 # Router: 6 views wrapped in MainLayout
│   ├── App.css                 # (unused — styles in index.css)
│   ├── main.jsx                # Entry point: BrowserRouter + FleetProvider
│   └── index.css               # Tailwind + custom theme (SDG green & white)
│
├── index.html                  # Vite HTML shell
├── vite.config.js              # Vite + React + Tailwind CSS plugin
├── package.json                # Dependencies & scripts
└── eslint.config.js            # Linting rules
```

---

## 5c. Frontend Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------| 
| React | 19.2 | UI framework |
| Vite | 7.3 | Build tool & dev server |
| Tailwind CSS | 4.2 | Utility-first styling |
| React Router DOM | 7.13 | Client-side routing |
| Axios | 1.13 | HTTP client for API calls |
| Leaflet / React-Leaflet | 1.9 / 5.0 | Interactive map rendering |
| Recharts | 3.8 | Charts (Area, Bar, Pie) |
| Framer Motion | 12.35 | Page transition animations |
| Lucide React | 0.577 | Icon library |

---

## 5d. Frontend Pages & Components

### Routing (App.jsx)

| Route | View | Description |
|-------|------|-------------|
| `/` | LiveOps | Main operational view — live map + KPIs + alerts |
| `/strategic` | StrategicOverview | Fleet KPI dashboard + ridership charts + peak zones |
| `/control-center` | OperationalControl | AI recommendations + anomaly monitor + command log |
| `/analytics` | Analytics | Charts: ridership trends, mode share, depot utilization |
| `/multi-modal` | MultiModal | Metro Purple Line visualization + hub connectivity |
| `/fleet` | FleetManagement | Searchable bus fleet table with occupancy & status |

### Key Components

| Component | Description |
|-----------|-------------|
| **MainLayout** | Root shell: left sidebar nav + AI assistant floating button |
| **SidebarNavigation** | 80px icon sidebar with NavLink active states |
| **LiveMap** | Leaflet map centered on Pune (18.52, 73.85). Renders bus dots (color-coded by load), route polylines, depot markers, demand zone circles |
| **KPICard** | Reusable card: icon + label + value + unit. Used on LiveOps & Strategic views |
| **AlertsSidebar** | Scrollable alert feed with severity (critical/high/medium/low), timestamps, acknowledge button |
| **RecommendationsSidebar** | AI insight cards with "Deploy Optimization" action buttons |
| **AIAssistant** | Floating chat drawer (bottom-right). Mock AI responses with SDG-themed suggestions |
| **BusTransition** | Animated SVG bus drives across screen on page change (~2s), then fades to reveal content |
| **DashboardLayout** | Flexible 3-zone layout (sidebar + topbar + content area) |

### Data Flow (Frontend)

```
FleetProvider (context)
  │  polls GET /api/dashboard every 3 seconds
  │
  ▼
FleetContext.Provider
  │  exposes: routes, buses, depots, demandZones, metro,
  │           alerts, metrics, metricsFormatted, recommendations,
  │           routeStats, zoneStats, alertStats, fleetDistribution,
  │           systemStatus, events, loading, error, refresh
  │
  ▼
useFleet() hook in any component
  │
  ▼
Components render live data + call POST endpoints for actions
```

### API Service (services/api.js)

**Base URL:** `http://localhost:5000/api`

**GET functions:**
- `fetchDashboardData()` — `/dashboard` (primary polling endpoint)
- `fetchRoutes()`, `fetchBuses()`, `fetchDepots()`
- `fetchAlerts()`, `fetchMetrics()`, `fetchRecommendations()`, `fetchPredictions()`

**POST functions:**
- `deployBus(depotId, routeId)` — `/deploy-bus`
- `returnBus(busId, depotId)` — `/return-bus`
- `changeFrequency(routeId, frequency)` — `/change-frequency`
- `acknowledgeAlert(alertId)` — `/acknowledge-alert`
- `acknowledgeAllAlerts()` — `/acknowledge-all-alerts`
- `emergencyDispatch(routeId, count)` — `/emergency-dispatch`

---

## 5e. Design System

**Theme:** SDG-inspired green & white — clean, professional, data-dense

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#10b981` (emerald-500) | Buttons, accents, active states |
| `--color-accent` | `#0f172a` (slate-900) | Headings, strong text |
| `--color-main` | `#f8fafc` (slate-50) | Page background |
| `--color-card` | `#ffffff` | Card surfaces |
| `--color-danger` | `#ef4444` | Critical alerts, errors |
| `--color-warning` | `#f59e0b` | Medium alerts, delays |
| `--color-info` | `#3b82f6` | Metro, informational |

**Key CSS patterns:**
- `.glass` — white card with subtle border, hover shadow lift, green border accent
- `.nav-sidebar` — 80px fixed left navigation
- `.progress-container` / `.progress-fill` — custom progress bars
- `.btn-primary` / `.btn-primary-ghost` — primary action buttons
- `.alert-critical|high|medium|low` — severity-styled alert cards
- `.animate-fade-in` — entry animation for view transitions

**Map tile:** CartoDB Positron (`light_all`) — minimal grey basemap

---

## 6. Data Model

### Routes (10 routes)
```javascript
{
  route_id: "R1",
  name: "Swargate → Hinjewadi IT Park",
  stops: [ { lat: 18.5018, lng: 73.8636 }, ... ],
  frequency: 8,        // minutes between departures
  route_length_km: 18
}
```

### Buses (50 buses)
```javascript
{
  bus_id: "BUS001",
  route_id: "R1",
  lat: 18.5018,
  lng: 73.8636,
  capacity: 50,
  current_load: 32,
  status: "active"     // active | crowded | underutilized | idle | maintenance
}
```

### Depots (4 depots)
```javascript
{
  depot_id: "D1",
  name: "Swargate Depot",
  lat: 18.5018,
  lng: 73.8636,
  total_buses: 18,
  idle_buses: 5
}
```

### Demand Zones (12 zones)
```javascript
{
  zone_id: "Z1",
  name: "Hinjewadi IT Park",
  lat: 18.5912,
  lng: 73.7389,
  base_demand: 95,
  current_demand: 102,     // Updated by demandSimulator every 5s
  predicted_demand: 115,   // Updated by predictionEngine every 10s
  demand_history: [...]    // Ring buffer (last 5 values) used by predictionEngine
}
```

### Metro
```javascript
{
  line_name: "Purple Line",
  status: "normal",      // normal | crowded | delayed
  delay_minutes: 0,
  stations: [ { lat, lng }, ... ],
  passenger_flow: 8000   // Updated by metroSimulator (time-of-day aware)
}
```

### City Events
```javascript
{
  event_id: "EVT001",
  name: "Festival at Shivajinagar",
  zone_id: "Z3",
  type: "festival",              // concert | sports | festival | conference | rain
  demand_multiplier: 1.8,        // Applied to zone demand by demandSimulator
  lat: 18.53,
  lng: 73.85,
  start_time: 1710000000000,     // Unix ms
  end_time: 1710003600000,       // Unix ms (5-15 min duration)
  active: true
}
```

### Alert
```javascript
{
  id: "ALERT_1710000001_abc123",
  type: "overcrowded_bus",       // see ALERT_TYPES in constants.js
  severity: "critical",          // low | medium | high | critical
  message: "Bus BUS004 is overcrowded at 97% capacity",
  data: { bus_id, route_id, load_factor },
  timestamp: "2024-03-10T09:00:00.000Z",
  acknowledged: false
}
```

### Recommendation
```javascript
{
  recommendation_id: "REC001",
  action: "deploy_bus",        // see RECOMMENDATION_TYPES below
  route_id: "R1",
  priority: "urgent",          // low | medium | high | urgent
  reason: "High passenger load detected on R1 (93%)",
  timestamp: "2024-03-10T09:00:00.000Z"
}
```

---

## 7. Dynamic Data Simulation Concept

### The Problem

Real transport systems have live telemetry from GPS devices, passenger counters, and traffic feeds. This project has **no access to real data**.

### The Solution

The system generates **synthetic dynamic data** through simulation loops that update the central state object continuously.

### Central State Object

All live data exists in a **single shared runtime object**:

```javascript
// state/systemState.js
const systemState = {
  routes: [...],          // Static route definitions
  buses: [...],           // Dynamic - updated every 3 seconds by busSimulator
  depots: [...],          // Dynamic - updated by fleet operations
  demandZones: [...],     // Dynamic - updated every 5 seconds by demandSimulator
  metro: {...},           // Dynamic - updated every 10 seconds by metroSimulator
  events: [...],          // Dynamic - managed by eventSimulator every 60 seconds
  alerts: [...],          // Dynamic - generated by alertEngine every 5 seconds
  recommendations: [...], // Dynamic - generated by recommendationEngine every 10 seconds
  metrics: {...},         // Dynamic - calculated by metricsController every 10 seconds
  simulation: {           // Tracks simulation runtime state
    is_running: true,
    started_at: "...",
    tick_count: 0
  }
};
```

### Golden Rule

**All modules must read and write ONLY to systemState.**

Never create parallel data structures or alternative state objects.

---

## 8. Simulation Modules

### Bus Simulator (busSimulator.js)
- **Interval:** Every 3 seconds
- **Algorithm:**
  1. On startup: spread buses evenly along their routes (not all at stop 0) via `initializeBusProgress()`
  2. Each bus tracks `{ stopIndex, t (0→1 interpolation), atStop, ticksAtStop }` in a `busProgress` map
  3. Each tick: advance `t` by `STEP_SIZE = 0.14` (constant-speed linear interpolation between stops)
  4. When `t >= 1.0`: bus arrives at next stop → enter dwell state for 2 ticks (~6 seconds) → `simulateBoarding()`
  5. **Boarding logic:**
     - Passengers leaving: random 8–20 (capped by current load)
     - Passengers boarding: scaled by nearest demand zone — low demand (20) → 2–8, high demand (100) → 8–22
     - Demand decay: boarding passengers reduce the nearest zone's `current_demand` by the boarding count
  6. Status update: `crowded` (>85%), `active`, or `underutilized` (<30%)
  7. Buses with `idle` or `maintenance` status are skipped
  8. Increments `systemState.simulation.tick_count` each tick

### Demand Simulator (demandSimulator.js)
- **Interval:** Every 5 seconds
- **Algorithm:**
  1. Start with zone's `base_demand`
  2. Apply random fluctuation (−10 to +15)
  3. Apply current time multiplier: rush hour ×1.5, night ×0.6, normal ×1.0
  4. Apply metro impact (only for metro-connected zones): delayed → ×1.2–1.4, crowded → ×1.25
  5. Apply active city event multiplier (from eventSimulator)
  6. Clamp to valid range (20–120); update `current_demand`
  7. Record value in per-zone history ring buffer (last 6 ticks)
  8. Compute `predicted_demand` using weighted moving average of history + trend direction + future time multiplier (15 minutes ahead) + metro impact
- **Metro-connected zones:** PCMC, Shivajinagar, Deccan, Railway Station, Pune Station

### Metro Simulator (metroSimulator.js)
- **Interval:** Every 10 seconds
- **Algorithm:**
  1. Uses an `eventTicksRemaining` counter to prevent status flickering
  2. When timer expires: 12% chance to trigger a new status event
  3. New status selected via weighted random: normal (70% off-peak / 50% rush), crowded (20% / 35%), delayed (10% / 15%)
  4. Delayed events last 4–8 ticks (40–80 s); crowded 3–6 ticks; normal 5–12 ticks
  5. If delayed: set `delay_minutes` (5–20); otherwise gradually reduce delay by 1–3 min/tick
  6. Passenger flow: time-of-day ranges (rush: 14k–20k, day: 8k–13k, night: 2k–5k); delayed reduces by 40%, crowded increases by 15%
  7. Starts with normal status pre-set to avoid an immediate disruption event at demo launch

### Event Simulator (eventSimulator.js)
- **Interval:** Every 60 seconds
- **Algorithm:**
  1. Expire events whose `end_time` has passed; prune inactive events
  2. 20% chance per cycle to generate a new event (if fewer than 3 active)
  3. Pick a random unoccupied zone and a random event type
  4. Event types: concert (×1.7), sports/Cricket (×1.6), festival (×1.8), conference (×1.5), rain (×1.4)
  5. Event duration: 5–15 minutes (random)
  6. Demand multiplier applied to the zone by `demandSimulator`

---

## 9. AI Modules

### Prediction Engine (predictionEngine.js)
- **Interval:** Every 10 seconds
- **Per-zone 4-step algorithm:**
  1. **Weighted Moving Average** over the last 5 demand history records (most recent = weight 5)
  2. **Trend Momentum** — difference between last two values × 0.5, added to WMA
  3. **Time-of-Day Multiplier** — rush hour ×1.2, night ×0.8, normal ×1.0
  4. **Event Factor** — ×1.2 boost if an active city event targets this zone
  5. Clamps to `DEMAND_MIN`–`DEMAND_MAX` (20–120); stores in `zone.predicted_demand`
- **`getPredictionSummary()`** — returns average predicted demand across zones + list of all zones where `predicted > current × 1.2`

### Alert Engine (alertEngine.js)
- **Interval:** Every 5 seconds
- **Detects:**
  - `overcrowded_bus` — bus load > 90%; critical if > 95%
  - `overcrowded_route` — route avg load > 85% (OVERCROWDED_THRESHOLD); severity HIGH
  - `underutilized_route` — route avg load < 30% with more than 1 bus; severity LOW
  - `demand_spike` — predicted / current > 1.3; HIGH if ratio > 1.5, else MEDIUM
  - `metro_disruption` — metro delayed ≥ 10 min; HIGH if > 15 min, else MEDIUM
- **Deduplication:** won't create a new alert if an unacknowledged alert of the same type for the same target already exists
- **Memory cap:** keeps last 100 alerts; older ones are dropped
- **Exports:** `startAlertEngine`, `runAlertChecks`, `getActiveAlerts`, `acknowledgeAlert`, `createAlert`

### Recommendation Engine (recommendationEngine.js)
- **Interval:** Every 10 seconds; stores top 5 in `systemState.recommendations`
- **9 Recommendation Types:**

| Type | Trigger | Priority |
|------|---------|----------|
| `deploy_bus` | Route load > 85% or demand spike alert | URGENT/HIGH/MEDIUM |
| `increase_frequency` | Route load > 85% and current frequency > 5 min | HIGH |
| `decrease_frequency` | Route load < 30% and frequency < 15 min | LOW |
| `rebalance_fleet` | Routes with load > 80% vs routes with load < 30% (> 2 buses) | MEDIUM |
| `metro_support` | Metro delayed ≥ 10 min → top 3 routes get suggestions | HIGH |
| `extend_route` | High-demand zone (> 70) not covered by any route within 1.5 km | HIGH |
| `add_stop` | Zone near an existing route (< 1.5 km) with predicted surge > 20% | MEDIUM |
| `express_variant` | Route load > 85% with ≥ 5 stops → skip ~30% of stops | HIGH |
| `reroute` | Bus route passes within 1 km of a delayed metro station | URGENT |

- Geospatial analysis uses an internal Haversine implementation (separate from geoUtils)
- All recommendations are sorted by priority (urgent > high > medium > low), returns top N

---

## 10. Controllers

### Fleet Controller (fleetController.js)
Handles operational actions and query helpers:

**Fleet Operations**
- `deployBus(depotId, routeId)` — Creates new bus (BUS101+) at route's first stop; decrements depot idle count
- `returnBusToDepot(busId, depotId)` — Removes bus from `systemState.buses`; increments depot idle count
- `changeRouteFrequency(routeId, newFrequency)` — Validates 5–30 min range
- `rebalanceBuses(fromRoute, toRoute, count)` — Moves lowest-load buses from source route; leaves at least 1 bus
- `emergencyDispatch(routeId, count)` — Iterates available depots to quickly deploy multiple buses

**Query Helpers**
- `getFleetDistribution()` — `{ byRoute: { count, avgLoad }, byDepot: { idle, total }, totalActive, totalIdle }`
- `getBusDetails(busId)` — Bus data with `load_percent` and `route_name`
- `getRouteDetails(routeId)` — Route data with `bus_count`, `load_percent`, and `buses[]` array
- `getBusesFiltered(routeId, status)` — Filter by route and/or status, adds `load_percent`

### Metrics Controller (metricsController.js)
Calculates KPIs every 10 seconds and provides analytics endpoints:

**Core KPIs** (written to `systemState.metrics`)
- `fleet_utilization` — Average load across all active buses (%)
- `passenger_throughput` — Total passengers currently on active buses
- `average_wait_time` — Mean of (route.frequency / 2) across all routes
- `demand_fulfillment` — min(100, totalCapacity / totalDemand × 100)
- `route_balance` — 100 − sqrt(variance of load factors) × 200 (0–100)
- `system_efficiency` — 0.4 × utilization + 0.3 × fulfillment + 0.3 × balance
- `active_buses` / `total_buses` — Fleet activity counts
- `active_alerts` — Unacknowledged alert count
- `last_updated` — ISO timestamp

**Analytics Accessors**
- `getMetrics()` — Raw metrics snapshot
- `getDashboardMetrics()` — Formatted metrics with `{ value, unit, label }` for UI cards
- `getRouteStats()` — Per-route utilization with `bus_statuses` breakdown, sorted by load descending
- `getZoneStats()` — Per-zone demand with `surge_percent` and `is_surging` (>20%), sorted by surge descending
- `getAlertStats()` — `{ total_active, total_acknowledged, by_type, by_severity }`
- `getSystemStatus()` — Simulation health: uptime, tick_count, entity counts, active events/alerts

---

## 11. Utilities

### geoUtils.js
| Function | Description |
|----------|-------------|
| `calculateDistance(lat1, lng1, lat2, lng2)` | Haversine distance in km |
| `toRadians(degrees)` | Degree to radian conversion |
| `interpolatePosition(start, end, fraction)` | Linear interpolation between two `{lat, lng}` points |
| `getNextPosition(stops, currentStopIndex, progressToNext, direction)` | Route traversal with direction reversal at endpoints |
| `isWithinRadius(point1, point2, radiusKm)` | Proximity boolean check |
| `findNearest(origin, points)` | Returns `{ point, distance }` of nearest item |
| `calculateRouteLength(stops)` | Sum of Haversine distances between consecutive stops |

> Note: `busSimulator.js` uses its own inline LERP for movement; `geoUtils.calculateDistance` is used for boarding proximity checks.

### randomGenerator.js
`randomInt`, `randomFloat`, `randomChance`, `applyVariation`, `gaussianRandom` (Box-Muller), `randomElement`, `weightedRandom`, `shuffleArray`

### timeUtils.js
`getCurrentHour`, `getCurrentMinute`, `getDecimalHour`, `isMorningRush`, `isEveningRush`, `isRushHour`, `getRushHourType`, `getMinutesUntilRushHour`, `isNightTime`, `getTimePeriod`, `formatTimestamp`, `formatDuration`

---

## 12. Configuration

### constants.js

| Constant | Value | Description |
|----------|-------|-------------|
| `BUS_CAPACITY_MIN/MAX` | 40/60 | Bus capacity range |
| `BUS_SPEED_KMH` | 25 | Reference speed |
| `OVERCROWDED_THRESHOLD` | 0.85 (85%) | Triggers overcrowded alerts and deploy recs |
| `UNDERUTILIZED_THRESHOLD` | 0.30 (30%) | Triggers underutilized alerts and frequency recs |
| `DEMAND_MIN/MAX` | 20/120 | Valid demand range |
| `DEMAND_SPIKE_THRESHOLD` | 1.3 | predicted/current ratio that triggers spike alert |
| `METRO_DELAY_IMPACT_THRESHOLD` | 10 | Minutes of delay to trigger metro disruption alert |
| `API_PORT` | 5000 | Express server port |
| `ALERT_TYPES` | 6 types | overcrowded_bus, overcrowded_route, underutilized_route, demand_spike, metro_disruption, fleet_imbalance |
| `SEVERITY` | 4 levels | low, medium, high, critical |

### simulationConfig.js

| Constant | Value | Description |
|----------|-------|-------------|
| `BUS_UPDATE_INTERVAL` | 3000 ms | Bus position update frequency |
| `DEMAND_UPDATE_INTERVAL` | 5000 ms | Demand zone update frequency |
| `METRO_UPDATE_INTERVAL` | 10000 ms | Metro status check frequency |
| `EVENT_UPDATE_INTERVAL` | 60000 ms | City event evaluation frequency |
| `PREDICTION_INTERVAL` | 10000 ms | Demand prediction run frequency |
| `ALERT_CHECK_INTERVAL` | 5000 ms | Alert check frequency |
| `METRICS_UPDATE_INTERVAL` | 10000 ms | KPI recalculation frequency |
| `RUSH_HOURS` | morning: 8–10, evening: 17–20 | Rush hour windows |
| `VARIABILITY.demandFluctuation` | 0.15 | ±15% random variation |
| `VARIABILITY.boardingVariation` | 0.20 | ±20% boarding variation |
| `VARIABILITY.delayProbability` | 0.05 | 5% metro delay chance |

---

## 13. API Endpoints

All endpoints are available at both `/` and `/api/` prefix (e.g., `/buses` and `/api/buses`).

### Health Check

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Server health, uptime, timestamp |

### Data Retrieval (GET)

| Endpoint | Description |
|----------|-------------|
| `GET /routes` | All 10 routes with stops and frequency |
| `GET /routes/:routeId` | Single route detail with assigned buses and load stats |
| `GET /buses` | All buses with live positions and loads |
| `GET /buses?routeId=R1&status=crowded` | Filter buses by route and/or status |
| `GET /buses/:busId` | Single bus detail with load_percent and route_name |
| `GET /depots` | Depot status and idle bus counts |
| `GET /demand` | Zone demand levels (current + predicted) |
| `GET /metro` | Metro status and delay information |
| `GET /events` | Active city events only (filtered) |
| `GET /alerts` | Active (unacknowledged) alerts |
| `GET /alert-stats` | Alert breakdown by type and severity |
| `GET /metrics` | System KPIs (raw metrics object) |
| `GET /recommendations?count=5` | Top N optimization suggestions (default 5) |
| `GET /predictions` | Demand prediction summary from AI engine |
| `GET /fleet-distribution` | Buses per route/depot with avg load |
| `GET /route-stats` | Per-route utilization sorted by load (hottest first) |
| `GET /zone-stats` | Per-zone demand with surge detection |
| `GET /system-status` | Simulation runtime: uptime, tick count, entity counts |
| `GET /dashboard` | Combined view: buses, routes, depots, demandZones, metro, alerts, metrics, metricsFormatted, recommendations, events, routeStats, zoneStats, alertStats, fleetDistribution, systemStatus, timestamp |

### Fleet Actions (POST)

| Endpoint | Parameters | Description |
|----------|------------|-------------|
| `POST /deploy-bus` | depotId, routeId | Deploy bus to route (creates new bus object) |
| `POST /return-bus` | busId, depotId | Return bus to depot (removes from fleet) |
| `POST /change-frequency` | routeId, frequency | Adjust route timing (5–30 min) |
| `POST /rebalance` | fromRouteId, toRouteId, count | Move buses between routes |
| `POST /acknowledge-alert` | alertId | Mark single alert handled |
| `POST /acknowledge-all-alerts` | — | Acknowledge all active alerts |
| `POST /emergency-dispatch` | routeId, count | Rapid multi-bus deployment from nearest depots |

All POST endpoints include input validation and return `{ success, message }` responses.

---

## 14. Data Flow

```
SIMULATION LOOPS (continuous)
     │
     ▼
┌──────────────────────────────────────────┐
│         systemState (mutated)            │
│  buses[].lat, buses[].lng                │
│  buses[].current_load                    │
│  demandZones[].current_demand            │
│  demandZones[].predicted_demand          │
│  demandZones[].demand_history            │
│  metro.status, metro.delay_minutes       │
│  metro.passenger_flow                    │
│  events[] (active city events)           │
└──────────────────────────────────────────┘
     │
     ▼
AI ENGINES (analyze state)
     │
     ▼
┌──────────────────────────────────────────┐
│         systemState (mutated)            │
│  alerts[] - generated alerts             │
│  recommendations[] - top 5 stored        │
│  metrics{} - calculated KPIs             │
└──────────────────────────────────────────┘
     │
     ▼
API LAYER (reads state → JSON)
     │
     ▼
GET /api/dashboard (combined payload)
     │
     ▼
┌──────────────────────────────────────────┐
│     FRONTEND (React FleetContext)        │
│  polls every 3s → updates all views     │
│  POST actions → fleet operations         │
└──────────────────────────────────────────┘
```

---

## 15. Current Implementation Status

### ✅ Backend — Fully Implemented & Tested

| Module | Status |
|--------|--------|
| Server (server.js) | Running on port 5000 with `/health` endpoint |
| All data files | 10 routes, 50 buses, 4 depots, 12 zones, metro |
| systemState.js | Central state object with routes, buses, depots, demandZones, metro, events, alerts, recommendations, metrics, simulation |
| busSimulator.js | Linear interpolation, demand-scaled boarding, zone demand decay, dwell time |
| demandSimulator.js | Trend-based prediction, metro impact, event multipliers, history ring buffer |
| metroSimulator.js | Event persistence (no flickering), passenger flow by time-of-day |
| eventSimulator.js | 5 event types, TTL expiry, max 3 concurrent events, 20% spawn probability |
| metricsController.js | 6 KPIs + route/zone/alert/system analytics |
| alertEngine.js | 5 alert types: overcrowded bus, overcrowded route, underutilized route, demand spike, metro disruption |
| recommendationEngine.js | 9 recommendation types with geospatial route analysis |
| predictionEngine.js | 4-step demand forecasting (WMA + trend + time-of-day + event) |
| fleetController.js | All fleet operations + query helpers |
| apiRoutes.js | 20+ endpoints (GET + POST) with input validation |

### ✅ Frontend — Fully Implemented

| Module | Status |
|--------|--------|
| React + Vite + Tailwind | Project scaffolded with all dependencies |
| FleetContext (polling) | Polls `/api/dashboard` every 3s, provides full data snapshot to all views |
| API service layer | All GET + POST endpoints wrapped in Axios functions |
| SidebarNavigation | 6-page icon navigation with active states |
| LiveOps (/) | Live Leaflet map + KPI ribbon + alerts sidebar |
| StrategicOverview (/strategic) | KPI cards + ridership chart + peak demand zones |
| OperationalControl (/control-center) | AI recommendations + anomalies + command log |
| Analytics (/analytics) | Ridership trend chart + mode share pie + depot bar chart |
| MultiModal (/multi-modal) | Metro line visual + hub connectivity + sync insights |
| FleetManagement (/fleet) | Searchable bus table with occupancy bars + status indicators |
| AIAssistant | Floating chat drawer with mock AI responses |
| BusTransition | Animated bus SVG page transition |
| KPICard | Reusable metric card component |
| Design system (index.css) | SDG green theme + glass cards + custom animations |

---

## 16. Development Rules

### MUST Follow

```javascript
// ✅ CORRECT: Mutate existing objects
systemState.buses[i].lat = newLat;
systemState.alerts.push(newAlert);
systemState.metrics.fleet_utilization = 78;

// ❌ WRONG: Replace entire arrays/objects
systemState.buses = newBusArray;
systemState = freshState;
let myBusesCopy = [...systemState.buses]; // DON'T create copies
```

### Key Constraints

1. **Single Source of Truth** - All modules use `systemState`
2. **No Duplicate State** - Never create parallel data structures
3. **In-Place Mutation** - Update fields, don't replace objects
4. **Clean Layer Separation** - Simulators don't call controllers directly
5. **Stateless API** - Each request reads current `systemState`
6. **Alert Deduplication** - Check `hasSimilarAlert()` before adding new alerts
7. **`systemState.recommendations` is maintained by `recommendationEngine`** — don't write to it elsewhere

---

## 17. Expected System Behavior

When the system is running:

| Component | Behavior |
|-----------|----------|
| **Buses** | Move continuously along routes via LERP, dwell 2 ticks at each stop, board/alight passengers scaled by nearby zone demand |
| **Demand** | Fluctuates every 5 seconds, influenced by time-of-day, metro status, and active city events |
| **Metro** | Status persists per event (no flickering), delays gradually resolve; passenger flow scales with time and status |
| **Events** | Generated every 60s with 20% probability; last 5–15 min; apply demand multipliers (×1.4–1.8) |
| **Alerts** | Appear every 5s when thresholds exceeded; deduplicated; max 100 stored |
| **Recommendations** | 9 types; updated every 10s; top 5 stored in `systemState.recommendations` |
| **Metrics** | Recalculate every 10 seconds showing real-time KPIs |
| **Dashboard** | Returns combined payload of all data in one call; frontend polls this every 3s |

### Example Runtime Behavior

```
[BusSimulator] 50 buses spread across 10 routes, updating every 3000ms
[DemandSimulator] Tracking 12 zones, updating every 5000ms
[MetroSimulator] Running every 10000ms
[EventSimulator] Checking every 60s | max 3 concurrent events
[PredictionEngine] Running every 10000ms
[AlertEngine] Running every 5000ms
[RecommendationEngine] Running every 10000ms
[MetricsController] Running every 10000ms
---
[BusSimulator] Bus BUS007: 11 passengers left, 8 boarded (38/50)
[DemandSimulator] Demand spike detected in Z4 (Festival at Shivajinagar)
[MetroSimulator] Purple Line status: delayed (12 min)
[AlertEngine] CRITICAL: Bus BUS004 at 96% capacity
[RecommendationEngine] 5 recommendations generated
[MetricsController] Metrics updated
[EventSimulator] New event: Cricket Match at Hadapsar (sports, ×1.6, ~9 min)
```

---

## End of Document

This document serves as the **single source of truth** for developers joining the Fleet Orchestrator project. All implementations must respect the dynamic state model and layered architecture described above.

### How to Run

```bash
# Backend (Terminal 1)
cd backend
npm install
node server.js
# → http://localhost:5000

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Both must be running simultaneously. The frontend polls the backend at `http://localhost:5000/api/dashboard`.
