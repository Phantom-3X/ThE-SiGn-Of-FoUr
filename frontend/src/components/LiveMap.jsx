import React, { useEffect } from 'react';
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

const createBusIcon = (status, loadPercent, bearing = 90, busId = '') => {
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

const depotIcon = L.divIcon({
    html: `<div style="background-color: #6366f1; width: 16px; height: 16px; border-radius: 4px; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: bold;">D</div>`,
    className: 'custom-depot-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const LiveMap = ({ buses = [], depots = [], routes = [], demandZones = [] }) => {
    const puneCenter = [18.5204, 73.8567];

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
            {routes.filter(r => r.stops && r.stops.length > 0).map(route => (
                <Polyline 
                    key={route.route_id}
                    positions={route.stops.map(s => [s.lat, s.lng])}
                    pathOptions={{ color: '#10b981', weight: 2, opacity: 0.4 }}
                />
            ))}


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

            {/* Buses */}
            {buses.map((bus, idx) => {
                const loadPercent = (bus.current_load / bus.capacity) * 100;
                // Calculate bearing using next bus in same route as reference
                // or use a default eastward bearing
                const nextBus = buses.find(b => b.route_id === bus.route_id && b.bus_id !== bus.bus_id);
                const bearing = nextBus
                    ? calculateBearing(bus.lat, bus.lng, nextBus.lat, nextBus.lng)
                    : 90;
                return (
                    <Marker 
                        key={bus.bus_id} 
                        position={[bus.lat, bus.lng]} 
                        icon={createBusIcon(bus.status, loadPercent, bearing, bus.route_id)}
                    >
                        <Popup>
                            <div className="text-slate-900">
                                <strong>Bus: {bus.bus_id}</strong><br/>
                                Route: {bus.route_id}<br/>
                                Load: {bus.current_load} / {bus.capacity} ({loadPercent.toFixed(0)}%)<br/>
                                Status: {bus.status}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
};

export default LiveMap;
