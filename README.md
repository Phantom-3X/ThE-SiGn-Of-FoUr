# 🚍 Fleet Orchestrator

### Real-Time Intelligent Public Transport Orchestration Platform

Fleet Orchestrator is a **real-time AI-powered public transport management system** built as a hackathon prototype for **smart city mobility optimization**.

The platform simulates live fleet operations, predicts passenger demand, detects anomalies, and recommends operational actions for transport authorities.

It demonstrates how **data-driven fleet orchestration** can improve urban transit efficiency.

---

# 🌐 Live Deployment

### Frontend

https://the-sign-of-four-fleet-orchestrator.vercel.app

### Backend API

https://fleet-orchestrator-backend-f4r0.onrender.com

---

# 📸 Screenshots

Add screenshots in `/docs`.

Example:

```
docs/
 ├ Analytics.png
 ├ control-center.png
 ├ dashboard.png
 ├ map-view.png
```

---

# 🧠 Problem Statement

Urban public transport systems face major challenges:

* **Overcrowded buses on high demand routes**
* **Underutilized buses on low demand routes**
* **Unpredictable passenger wait times**
* **No real-time demand visibility**
* **Manual decision making by operators**
* **Lack of integration with metro disruptions**

Fleet Orchestrator demonstrates a **smart orchestration system** capable of:

* Monitoring live fleet operations
* Predicting passenger demand
* Detecting operational anomalies
* Generating actionable recommendations
* Enabling operator intervention through a control center dashboard

---

# 🎯 Key Features

### Real-Time Fleet Monitoring

Track live bus positions, passenger load, and route activity.

### AI Demand Prediction

Forecast demand spikes using time patterns, events, and metro disruptions.

### Anomaly Detection

Automatically detect:

* overcrowded buses
* underutilized routes
* demand spikes
* metro disruptions

### Intelligent Recommendations

Suggest optimal actions:

* deploy additional buses
* rebalance fleet between routes
* adjust route frequency

### Multi-Modal Integration

Metro disruptions affect bus demand calculations.

### Operational Control Center

Transport operators can:

* deploy buses
* rebalance fleet
* change route frequencies
* acknowledge alerts

---

# 🏗 System Architecture

Fleet Orchestrator follows a **layered full-stack architecture**.

```
Frontend Dashboard (React + Vite)
          │
          ▼
API Layer (Express REST APIs)
          │
          ▼
Controllers
(fleetController, metricsController)
          │
          ▼
AI Layer
(predictionEngine, alertEngine, recommendationEngine)
          │
          ▼
Simulation Layer
(busSimulator, demandSimulator, metroSimulator, cityEventSimulator)
          │
          ▼
Central System State
(systemState.js)
          │
          ▼
Data Layer
(routes, buses, depots, demand zones, metro)
```

The system uses a **single source of truth state object** that all modules read and update.

---

# 📊 System Capabilities

| Capability                | Description                            |
| ------------------------- | -------------------------------------- |
| Demand Prediction         | Forecast passenger demand patterns     |
| Fleet Optimization        | Deploy and rebalance buses dynamically |
| Multi-Modal Integration   | Metro disruptions affect bus demand    |
| Real-Time Monitoring      | Visual dashboard with live fleet map   |
| Operator Decision Support | AI-generated recommendations           |

---

# 🖥 Frontend

### Tech Stack

* React 19
* Vite
* Tailwind CSS
* React Router
* Axios
* Leaflet / React-Leaflet
* Recharts
* Framer Motion
* Lucide Icons

### Key Views

| Page               | Description                  |
| ------------------ | ---------------------------- |
| Live Operations    | Real-time fleet map + alerts |
| Strategic Overview | KPI dashboard + analytics    |
| Control Center     | AI recommendations + actions |
| Analytics          | Ridership trends and charts  |
| Multi Modal        | Metro integration dashboard  |
| Fleet Management   | Searchable fleet table       |

### Frontend Data Flow

```
FleetContext
   │
polls /api/dashboard every 3 seconds
   │
React Components render live system state
```

---

# ⚙ Backend

### Tech Stack

* Node.js
* Express.js
* JavaScript
* Axios
* Custom simulation engine

---

### Backend Modules

| Module                | Description                   |
| --------------------- | ----------------------------- |
| Bus Simulator         | Moves buses along routes      |
| Demand Simulator      | Simulates zone demand changes |
| Metro Simulator       | Simulates metro disruptions   |
| Event Simulator       | Generates city events         |
| Alert Engine          | Detects anomalies             |
| Recommendation Engine | Generates fleet actions       |
| Metrics Controller    | Calculates KPIs               |

---

# 📂 Project Structure

## Backend

```
backend
 ├ config
 ├ data
 ├ state
 ├ simulation
 ├ ai
 ├ controllers
 ├ routes
 ├ utils
 └ server.js
```

## Frontend

```
frontend
 ├ components
 ├ views
 ├ services
 ├ hooks
 ├ context
 └ App.jsx
```

---

# 🔄 Dynamic Simulation Model

Because real transit data is unavailable, the system generates **synthetic dynamic data**.

Simulation loops update system state continuously:

| Module           | Update Interval |
| ---------------- | --------------- |
| Bus Simulator    | 3 seconds       |
| Demand Simulator | 5 seconds       |
| Metro Simulator  | 10 seconds      |
| AI Alerts        | 5 seconds       |
| Metrics          | 10 seconds      |

All modules update a **shared runtime state object**.

---

# 📡 API Endpoints

### Core Data

```
GET /routes
GET /buses
GET /depots
GET /demand
GET /metro
GET /events
GET /alerts
GET /metrics
GET /recommendations
GET /dashboard
```

### Analytics

```
GET /route-stats
GET /zone-stats
GET /alert-stats
GET /fleet-distribution
GET /system-status
```

### Fleet Operations

```
POST /deploy-bus
POST /return-bus
POST /change-frequency
POST /rebalance
POST /emergency-dispatch
POST /acknowledge-alert
POST /acknowledge-all-alerts
```

---

# 🛠 Installation Instructions

### Clone the repository

```
git clone https://github.com/your-username/fleet-orchestrator.git
cd fleet-orchestrator
```

---

# ▶ Running the Project

### Start Backend

```
cd backend
npm install
node server.js
```

Server runs at:

```
http://localhost:5000
```

---

### Start Frontend

```
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

# 📦 Dependencies

## Backend

```
express
cors
dotenv
axios
```

## Frontend

```
react
vite
tailwindcss
react-router-dom
axios
react-leaflet
leaflet
recharts
framer-motion
lucide-react
```

---


# 🚀 Future Improvements

* Integration with real GPS fleet data
* Machine learning demand models
* Passenger mobile application
* Real traffic API integration
* Electric vehicle fleet management

---

# 👨‍💻 Team

Team **The Sign of Four**

Built during a **24-hour hackathon**.

---

# 📜 License

This project was developed for **educational and hackathon demonstration purposes**.
