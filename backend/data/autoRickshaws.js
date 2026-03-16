/**
 * autoRickshaws.js
 *
 * Phase 4 — Auto-Rickshaw / Shared Vehicle Layer
 * 30 auto-rickshaws assigned to 6 hubs near major bus stops in Pune.
 */

const HUBS = {
  swargate:     { lat: 18.5018, lng: 73.8636, name: "Swargate" },
  shivajinagar: { lat: 18.5308, lng: 73.8475, name: "Shivajinagar" },
  deccan:       { lat: 18.5167, lng: 73.8411, name: "Deccan" },
  hinjewadi:    { lat: 18.5912, lng: 73.7389, name: "Hinjewadi" },
  kharadi:      { lat: 18.5362, lng: 73.9139, name: "Kharadi" },
  vimanNagar:   { lat: 18.5679, lng: 73.9143, name: "Viman Nagar" }
};

const autoRickshaws = [
  // Swargate hub (5 rickshaws)
  { id: "RK001", lat: 18.5021, lng: 73.8639, capacity: 3, status: "available", hub: "swargate",     hub_name: "Swargate" },
  { id: "RK002", lat: 18.5015, lng: 73.8630, capacity: 3, status: "available", hub: "swargate",     hub_name: "Swargate" },
  { id: "RK003", lat: 18.5025, lng: 73.8645, capacity: 3, status: "available", hub: "swargate",     hub_name: "Swargate" },
  { id: "RK004", lat: 18.5012, lng: 73.8628, capacity: 3, status: "available", hub: "swargate",     hub_name: "Swargate" },
  { id: "RK005", lat: 18.5019, lng: 73.8641, capacity: 3, status: "busy",      hub: "swargate",     hub_name: "Swargate" },

  // Shivajinagar hub (5 rickshaws)
  { id: "RK006", lat: 18.5310, lng: 73.8478, capacity: 3, status: "available", hub: "shivajinagar", hub_name: "Shivajinagar" },
  { id: "RK007", lat: 18.5305, lng: 73.8470, capacity: 3, status: "available", hub: "shivajinagar", hub_name: "Shivajinagar" },
  { id: "RK008", lat: 18.5312, lng: 73.8480, capacity: 3, status: "available", hub: "shivajinagar", hub_name: "Shivajinagar" },
  { id: "RK009", lat: 18.5302, lng: 73.8468, capacity: 3, status: "busy",      hub: "shivajinagar", hub_name: "Shivajinagar" },
  { id: "RK010", lat: 18.5315, lng: 73.8482, capacity: 3, status: "available", hub: "shivajinagar", hub_name: "Shivajinagar" },

  // Deccan hub (5 rickshaws)
  { id: "RK011", lat: 18.5170, lng: 73.8415, capacity: 3, status: "available", hub: "deccan",       hub_name: "Deccan" },
  { id: "RK012", lat: 18.5162, lng: 73.8407, capacity: 3, status: "available", hub: "deccan",       hub_name: "Deccan" },
  { id: "RK013", lat: 18.5175, lng: 73.8420, capacity: 3, status: "available", hub: "deccan",       hub_name: "Deccan" },
  { id: "RK014", lat: 18.5160, lng: 73.8405, capacity: 3, status: "offline",   hub: "deccan",       hub_name: "Deccan" },
  { id: "RK015", lat: 18.5172, lng: 73.8418, capacity: 3, status: "available", hub: "deccan",       hub_name: "Deccan" },

  // Hinjewadi hub (5 rickshaws)
  { id: "RK016", lat: 18.5915, lng: 73.7392, capacity: 3, status: "available", hub: "hinjewadi",    hub_name: "Hinjewadi" },
  { id: "RK017", lat: 18.5908, lng: 73.7385, capacity: 3, status: "available", hub: "hinjewadi",    hub_name: "Hinjewadi" },
  { id: "RK018", lat: 18.5920, lng: 73.7395, capacity: 3, status: "busy",      hub: "hinjewadi",    hub_name: "Hinjewadi" },
  { id: "RK019", lat: 18.5905, lng: 73.7382, capacity: 3, status: "available", hub: "hinjewadi",    hub_name: "Hinjewadi" },
  { id: "RK020", lat: 18.5918, lng: 73.7393, capacity: 3, status: "available", hub: "hinjewadi",    hub_name: "Hinjewadi" },

  // Kharadi hub (5 rickshaws)
  { id: "RK021", lat: 18.5365, lng: 73.9142, capacity: 3, status: "available", hub: "kharadi",      hub_name: "Kharadi" },
  { id: "RK022", lat: 18.5358, lng: 73.9135, capacity: 3, status: "available", hub: "kharadi",      hub_name: "Kharadi" },
  { id: "RK023", lat: 18.5370, lng: 73.9148, capacity: 3, status: "available", hub: "kharadi",      hub_name: "Kharadi" },
  { id: "RK024", lat: 18.5355, lng: 73.9132, capacity: 3, status: "offline",   hub: "kharadi",      hub_name: "Kharadi" },
  { id: "RK025", lat: 18.5368, lng: 73.9145, capacity: 3, status: "available", hub: "kharadi",      hub_name: "Kharadi" },

  // Viman Nagar hub (5 rickshaws)
  { id: "RK026", lat: 18.5682, lng: 73.9146, capacity: 3, status: "available", hub: "vimanNagar",   hub_name: "Viman Nagar" },
  { id: "RK027", lat: 18.5675, lng: 73.9140, capacity: 3, status: "available", hub: "vimanNagar",   hub_name: "Viman Nagar" },
  { id: "RK028", lat: 18.5685, lng: 73.9148, capacity: 3, status: "busy",      hub: "vimanNagar",   hub_name: "Viman Nagar" },
  { id: "RK029", lat: 18.5672, lng: 73.9137, capacity: 3, status: "available", hub: "vimanNagar",   hub_name: "Viman Nagar" },
  { id: "RK030", lat: 18.5680, lng: 73.9144, capacity: 3, status: "available", hub: "vimanNagar",   hub_name: "Viman Nagar" }
];

module.exports = autoRickshaws;
