import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for different statuses
/**
 * Calculate bearing in degrees between two GPS points
 * 0 = North, 90 = East, 180 = South, 270 = West
 */
const calculateBearing = (lat1, lng1, lat2, lng2) => {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const rlat1 = toRad(lat1);
  const rlat2 = toRad(lat2);
  const y = Math.sin(dLng) * Math.cos(rlat2);
  const x = Math.cos(rlat1) * Math.sin(rlat2) - Math.sin(rlat1) * Math.cos(rlat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const createBusIcon = (status, loadPercent, bearing = 90, busId = '', isRerouted = false) => {
  // Color based on status
  let bgColor = '#10b981';      // green — active
  let borderColor = '#059669';
  if (status === 'crowded' || loadPercent > 85) {
    bgColor = '#ef4444';
    borderColor = '#dc2626';
  } else if (loadPercent > 60) {
    bgColor = '#f59e0b';
    borderColor = '#d97706';
  } else if (status === 'underutilized') {
    bgColor = '#3b82f6';
    borderColor = '#2563eb';
  }

    if (isRerouted) {
        borderColor = '#111827';
    }

  // Extract route number from bus data — passed as routeId
  const label = busId || '';

  const html = `
    <div style="
      transform: rotate(${bearing - 90}deg);
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
    ">
      <svg width="48" height="28" viewBox="0 0 48 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Bus body top view -->
        <rect x="2" y="2" width="44" height="24" rx="4" fill="${bgColor}" stroke="${borderColor}" stroke-width="1.5"/>
        
        <!-- Windshield front -->
        <rect x="36" y="5" width="7" height="8" rx="2" fill="white" opacity="0.5"/>
        
        <!-- Windshield rear -->
        <rect x="5" y="5" width="5" height="8" rx="2" fill="white" opacity="0.3"/>
        
        <!-- Center stripe -->
        <rect x="2" y="13" width="44" height="2" fill="white" opacity="0.2"/>
        
        <!-- Left wheels -->
        <rect x="3" y="2" width="5" height="4" rx="1" fill="${borderColor}"/>
        <rect x="3" y="22" width="5" height="4" rx="1" fill="${borderColor}"/>
        
        <!-- Right wheels -->
        <rect x="40" y="2" width="5" height="4" rx="1" fill="${borderColor}"/>
        <rect x="40" y="22" width="5" height="4" rx="1" fill="${borderColor}"/>

        <!-- Route number text -->
        <text 
          x="24" 
          y="17" 
          text-anchor="middle" 
          font-family="system-ui, sans-serif" 
          font-size="9" 
          font-weight="900" 
          fill="white"
          letter-spacing="0.5"
        >${label}</text>
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-bus-icon',
    iconSize: [48, 28],
    iconAnchor: [24, 14]
  });
};

const createRikshawIcon = (status, routeId = '') => {
    let bodyColor = '#facc15';
    let borderColor = '#ca8a04';

    if (status === 'crowded') {
        bodyColor = '#f97316';
        borderColor = '#c2410c';
    } else if (status === 'underutilized') {
        bodyColor = '#60a5fa';
        borderColor = '#2563eb';
    }

    const label = routeId.replace('AR', 'R') || 'R';

    const html = `
        <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.22));
        ">
            <svg width="34" height="22" viewBox="0 0 34 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="30" height="14" rx="4" fill="${bodyColor}" stroke="${borderColor}" stroke-width="1.5"/>
                <rect x="5" y="7" width="24" height="3" rx="1.5" fill="white" opacity="0.45"/>
                <circle cx="9" cy="18" r="2" fill="${borderColor}"/>
                <circle cx="25" cy="18" r="2" fill="${borderColor}"/>
                <text x="17" y="15" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7" font-weight="900" fill="#111827">${label}</text>
            </svg>
        </div>
    `;

    return L.divIcon({
        html,
        className: 'custom-rikshaw-icon',
        iconSize: [34, 22],
        iconAnchor: [17, 11]
    });
};

const depotIcon = L.divIcon({
    html: `<div style="background-color: #6366f1; width: 16px; height: 16px; border-radius: 4px; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: bold;">D</div>`,
    className: 'custom-depot-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const rikshawDepotIcon = L.divIcon({
    html: `<div style="background-color: #f59e0b; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: #111827; font-size: 9px; font-weight: 900;">R</div>`,
    className: 'custom-rikshaw-depot-icon',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
});

const eventEmoji = { concert: '🎵', sports: '🏏', festival: '🎉', conference: '💼', rain: '🌧️' };
const eventBorderColor = { concert: '#9333ea', sports: '#2563eb', festival: '#ea580c', conference: '#475569', rain: '#0284c7' };

const createEventIcon = (type) => {
  const emoji = eventEmoji[type] || '📍';
  const border = eventBorderColor[type] || '#10b981';
  const html = `
    <div style="
      display: flex; flex-direction: column; align-items: center; gap: 0;
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));
    ">
      <div style="
        width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: white;
        border: 3px solid ${border};
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 16px; line-height: 1;">${emoji}</span>
      </div>
    </div>
  `;
  return L.divIcon({ html, className: 'custom-event-icon', iconSize: [36, 44], iconAnchor: [18, 44] });
};

function getPositionKey(lat, lng) {
    return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

function offsetMarkerPosition(lat, lng, index, total, radius = 0.00022) {
    if (total <= 1) return [lat, lng];

    const angle = (index / total) * Math.PI * 2;
    const latOffset = Math.sin(angle) * radius;
    const lngOffset = Math.cos(angle) * radius;

    return [lat + latOffset, lng + lngOffset];
}

const LiveMap = ({ buses = [], depots = [], routes = [], autoRikshawRoutes = [], autoRikshaws = [], demandZones = [], events = [] }) => {
    const puneCenter = [18.5204, 73.8567];
        const busPositionGroups = useMemo(() => {
                const groups = new Map();

                buses.forEach(bus => {
                        const key = getPositionKey(bus.lat, bus.lng);
                        if (!groups.has(key)) groups.set(key, []);
                        groups.get(key).push(bus.bus_id);
                });

                return groups;
        }, [buses]);

    return (
        <MapContainer 
            center={puneCenter} 
            zoom={13} 
            style={{ height: '100%', width: '100%', background: '#f1f5f9' }}
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* Routes */}
            {routes.filter(r => (r.path || r.stops) && ((r.path || r.stops).length > 0)).map(route => {
                const pathData = route.path && route.path.length > 0 ? route.path : route.stops;
                
                // Color based on active traffic load (only when route is NOT blocked)
                let routeColor = '#10b981'; // Green (default / low traffic)
                if (route.is_blocked) {
                    routeColor = '#94a3b8'; // Slate grey when blocked
                } else if (route.traffic_status === 'heavy') {
                    routeColor = '#ef4444'; // Red
                } else if (route.traffic_status === 'moderate') {
                    routeColor = '#f59e0b'; // Orange
                }

                const isBlocked = Boolean(route.is_blocked);

                return (
                <React.Fragment key={route.route_id}>
                    {/* Original path (dashed if blocked) */}
                    <Polyline 
                        positions={pathData.map(s => [s.lat, s.lng])}
                        pathOptions={{ 
                            color: routeColor, 
                            weight: isBlocked ? 3 : 4, 
                            opacity: isBlocked ? 0.4 : 0.6,
                            dashArray: isBlocked ? '8, 8' : null
                        }}
                    />
                    {/* Alternative detour path (orange dashed, visible only when blocked) */}
                    {isBlocked && route.alt_path && route.alt_path.length > 1 && (
                        <>
                            {/* Border layer — wider, darker, solid */}
                            <Polyline
                                positions={route.alt_path.map(s => [s.lat, s.lng])}
                                pathOptions={{
                                    color: '#9a3412',
                                    weight: 8,
                                    opacity: 0.6,
                                    dashArray: null
                                }}
                            />
                            {/* Foreground layer — orange dashed on top */}
                            <Polyline
                                positions={route.alt_path.map(s => [s.lat, s.lng])}
                                pathOptions={{
                                    color: '#f97316',
                                    weight: 4,
                                    opacity: 0.95,
                                    dashArray: '12, 6'
                                }}
                            />
                        </>
                    )}
                </React.Fragment>
            )})}

            {/* Auto-rikshaw routes */}
            {autoRikshawRoutes.filter(r => (r.path || r.stops) && ((r.path || r.stops).length > 0)).map(route => {
                const pathData = route.path && route.path.length > 0 ? route.path : route.stops;
                return (
                    <Polyline
                        key={route.route_id}
                        positions={pathData.map(s => [s.lat, s.lng])}
                        pathOptions={{
                            color: '#f59e0b',
                            weight: 2,
                            opacity: 0.85,
                            dashArray: '4, 6'
                        }}
                    />
                );
            })}

            {/* Demand Zones */}
            {demandZones.map(zone => (
                <Circle
                    key={zone.zone_id}
                    center={[zone.lat, zone.lng]}
                    radius={1000}
                    pathOptions={{
                        fillColor: zone.current_demand > 90 ? '#ef4444' : '#f59e0b',
                        fillOpacity: (zone.current_demand / 150) * 0.4,
                        color: 'transparent'
                    }}
                >
                    <Popup>
                        <div className="text-slate-900">
                            <strong>{zone.name}</strong><br/>
                            Demand: {zone.current_demand}
                        </div>
                    </Popup>
                </Circle>
            ))}

            {/* Depots */}
            {depots.map(depot => (
                <Marker 
                    key={depot.depot_id} 
                    position={[depot.lat, depot.lng]} 
                    icon={depotIcon}
                >
                    <Popup>
                        <div className="text-slate-900">
                            <strong>{depot.name}</strong><br/>
                            Idle Buses: {depot.idle_buses}
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Auto-rikshaw depots (terminal points of each route) */}
            {autoRikshawRoutes.map(route => {
                const terminalStop = route.stops && route.stops.length > 0
                    ? route.stops[route.stops.length - 1]
                    : null;

                if (!terminalStop) return null;

                return (
                    <Marker
                        key={`rikshaw-depot-${route.route_id}`}
                        position={[terminalStop.lat, terminalStop.lng]}
                        icon={rikshawDepotIcon}
                    >
                        <Popup>
                            <div className="text-slate-900">
                                <strong>Rikshaw Depot: {route.route_id}</strong><br/>
                                {route.name}<br/>
                                Terminal stop / route end
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {/* Event Pins */}
            {events.filter(e => e.active).map(event => (
                <Marker
                    key={event.event_id}
                    position={[event.lat, event.lng]}
                    icon={createEventIcon(event.type)}
                >
                    <Popup>
                        <div className="text-slate-900">
                            <strong>{event.name}</strong><br/>
                            Demand surge: ×{event.demand_multiplier}<br/>
                            {Math.max(0, Math.round((event.end_time - Date.now()) / 60000))} min remaining
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Buses */}
            {buses.map((bus, idx) => {
                const loadPercent = (bus.current_load / bus.capacity) * 100;
                const positionKey = getPositionKey(bus.lat, bus.lng);
                const groupedBuses = busPositionGroups.get(positionKey) || [bus.bus_id];
                const groupIndex = groupedBuses.indexOf(bus.bus_id);
                const markerPosition = offsetMarkerPosition(bus.lat, bus.lng, groupIndex, groupedBuses.length);
                // Calculate bearing using next bus in same route as reference
                // or use a default eastward bearing
                const nextBus = buses.find(b => b.route_id === bus.route_id && b.bus_id !== bus.bus_id);
                const bearing = nextBus
                    ? calculateBearing(bus.lat, bus.lng, nextBus.lat, nextBus.lng)
                    : 90;
                return (
                    <Marker 
                        key={bus.bus_id} 
                        position={markerPosition} 
                        icon={createBusIcon(bus.status, loadPercent, bearing, bus.route_id, Boolean(bus.auto_reroute))}
                    >
                        <Popup>
                            <div className="text-slate-900">
                                <strong>Bus: {bus.bus_id}</strong><br/>
                                Route: {bus.route_id}<br/>
                                {bus.auto_reroute && (
                                    <>
                                        <span style={{ color: '#7c3aed', fontWeight: 800 }}>Temporary Support</span><br/>
                                        Original Route: {bus.auto_reroute.original_route_id}<br/>
                                    </>
                                )}
                                Load: {bus.current_load} / {bus.capacity} ({loadPercent.toFixed(0)}%)<br/>
                                Status: {bus.status}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {/* Auto-rikshaws */}
            {autoRikshaws.map(rikshaw => {
                const loadPercent = (rikshaw.current_load / rikshaw.capacity) * 100;
                return (
                    <Marker
                        key={rikshaw.rikshaw_id}
                        position={[rikshaw.lat, rikshaw.lng]}
                        icon={createRikshawIcon(rikshaw.status, rikshaw.route_id)}
                    >
                        <Popup>
                            <div className="text-slate-900">
                                <strong>Auto-Rikshaw: {rikshaw.rikshaw_id}</strong><br/>
                                Route: {rikshaw.route_id}<br/>
                                Load: {rikshaw.current_load} / {rikshaw.capacity} ({loadPercent.toFixed(0)}%)<br/>
                                Status: {rikshaw.status}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
};

export default LiveMap;
