/**
 * eventSimulator.js
 *
 * Simulates city events (concerts, sports, festivals, conferences, rain)
 * that temporarily spike passenger demand in specific zones.
 *
 * Interval: every 60 seconds
 * Max concurrent active events: 3
 * New-event probability per cycle: 20%
 */

const systemState = require("../state/systemState");
const { EVENT_UPDATE_INTERVAL } = require("../config/simulationConfig");

// =============================================================================
// EVENT TYPE DEFINITIONS
// =============================================================================

const EVENT_TYPES = [
  { type: "concert",    label: "Concert",    multiplier: 1.7 },
  { type: "sports",     label: "Cricket Match", multiplier: 1.6 },
  { type: "festival",   label: "Festival",   multiplier: 1.8 },
  { type: "conference", label: "Tech Conference", multiplier: 1.5 },
  { type: "rain",       label: "Heavy Rain",  multiplier: 1.4 }
];

const MAX_ACTIVE_EVENTS = 3;
const NEW_EVENT_PROBABILITY = 0.2;
let eventCounter = 0;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate a random duration between 5 and 15 minutes (in ms).
 */
function randomDuration() {
  const minutes = 5 + Math.random() * 10; // 5–15
  return minutes * 60 * 1000;
}

/**
 * Pick a random element from an array.
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// =============================================================================
// CORE LOGIC
// =============================================================================

/**
 * Expire events whose end_time has passed.
 */
function expireEvents() {
  const now = Date.now();
  systemState.events.forEach(evt => {
    if (evt.active && now >= evt.end_time) {
      evt.active = false;
      console.log(`[EventSimulator] Event ended: ${evt.name}`);
    }
  });

  // Prune inactive events to keep the array lean
  systemState.events = systemState.events.filter(e => e.active);
}

/**
 * Attempt to generate a new city event.
 */
function maybeGenerateEvent() {
  // Cap concurrent active events
  const activeCount = systemState.events.filter(e => e.active).length;
  if (activeCount >= MAX_ACTIVE_EVENTS) return;

  // 20% chance each cycle
  if (Math.random() > NEW_EVENT_PROBABILITY) return;

  // Pick a random zone that doesn't already have an active event
  const occupiedZones = new Set(
    systemState.events.filter(e => e.active).map(e => e.zone_id)
  );
  const availableZones = systemState.demandZones.filter(
    z => !occupiedZones.has(z.zone_id)
  );
  if (availableZones.length === 0) return;

  const zone = pick(availableZones);
  const eventType = pick(EVENT_TYPES);

  eventCounter++;
  const now = Date.now();
  const duration = randomDuration();

  const event = {
    event_id: `EVT${String(eventCounter).padStart(3, "0")}`,
    name: `${eventType.label} at ${zone.name}`,
    zone_id: zone.zone_id,
    type: eventType.type,
    demand_multiplier: eventType.multiplier,
    lat: zone.lat,
    lng: zone.lng,
    start_time: now,
    end_time: now + duration,
    active: true
  };

  systemState.events.push(event);
  console.log(
    `[EventSimulator] New event: ${event.name} (${eventType.type}, ×${eventType.multiplier}, ~${Math.round(duration / 60000)} min)`
  );

  return event;
}

function triggerManualEvent(zoneId, eventTypeName, durationMinutes = 10) {
  const activeCount = systemState.events.filter(e => e.active).length;
  if (activeCount >= MAX_ACTIVE_EVENTS) {
    return { success: false, message: `Maximum active events reached (${MAX_ACTIVE_EVENTS})` };
  }

  const zone = systemState.demandZones.find(z => z.zone_id === zoneId);
  if (!zone) {
    return { success: false, message: `Zone ${zoneId} not found` };
  }

  const alreadyOccupied = systemState.events.some(e => e.active && e.zone_id === zone.zone_id);
  if (alreadyOccupied) {
    return { success: false, message: `An active event already exists in ${zone.name}` };
  }

  const eventType = EVENT_TYPES.find(e => e.type === eventTypeName) || EVENT_TYPES[0];

  eventCounter++;
  const now = Date.now();
  const duration = Math.max(1, durationMinutes) * 60 * 1000;
  const event = {
    event_id: `EVT${String(eventCounter).padStart(3, "0")}`,
    name: `${eventType.label} at ${zone.name}`,
    zone_id: zone.zone_id,
    type: eventType.type,
    demand_multiplier: eventType.multiplier,
    lat: zone.lat,
    lng: zone.lng,
    start_time: now,
    end_time: now + duration,
    active: true,
    manual: true
  };

  systemState.events.push(event);
  console.log(`[EventSimulator] Manual event triggered: ${event.name} (~${durationMinutes} min)`);

  return { success: true, message: `${event.name} triggered successfully`, event };
}

// =============================================================================
// SIMULATION LOOP
// =============================================================================

function tickEventSimulation() {
  expireEvents();
  maybeGenerateEvent();
}

function startEventSimulation() {
  console.log("[EventSimulator] Initializing city event simulation...");

  setInterval(tickEventSimulation, EVENT_UPDATE_INTERVAL);

  console.log(
    `[EventSimulator] Checking every ${EVENT_UPDATE_INTERVAL / 1000}s | max ${MAX_ACTIVE_EVENTS} concurrent events`
  );
}

module.exports = {
  startEventSimulation,
  triggerManualEvent,
  EVENT_TYPES
};
