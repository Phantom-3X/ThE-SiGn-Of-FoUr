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
const createBusIcon = (status, loadPercent) => {
    let color = '#22c55e'; // Green
    if (status === 'crowded' || loadPercent > 85) color = '#ef4444'; // Red
    else if (loadPercent > 60) color = '#f59e0b'; // Orange
    else if (status === 'underutilized') color = '#3b82f6'; // Blue

    const html = `
        <div style="
            background-color: ${color};
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px ${color};
        "></div>
    `;
    return L.divIcon({
        html,
        className: 'custom-bus-icon',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
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
            {buses.map(bus => {
                const loadPercent = (bus.current_load / bus.capacity) * 100;
                return (
                    <Marker 
                        key={bus.bus_id} 
                        position={[bus.lat, bus.lng]} 
                        icon={createBusIcon(bus.status, loadPercent)}
                    >
                        <Popup>
                            <div className="text-slate-900">
                                <strong>Bus: {bus.bus_id}</strong><br/>
                                Route: {bus.route_id}<br/>
                                Load: {bus.current_load} / {bus.capacity} (${loadPercent.toFixed(0)}%)<br/>
                                Status: ${bus.status}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
};

export default LiveMap;
