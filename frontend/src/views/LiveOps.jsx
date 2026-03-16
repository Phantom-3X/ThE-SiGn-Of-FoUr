import React from 'react';
import LiveMap from '../components/LiveMap';
import KPICard from '../components/KPICard';
import { useFleet } from '../context/FleetContext';
import { acknowledgeAlert } from '../services/api';
import api from '../services/api';
import {
  Users, Clock, Activity, Zap, Leaf, Layers,
  AlertTriangle, XCircle
} from 'lucide-react';

const LiveOps = () => {
  const {
    metrics = {}, buses = [], routes = [], depots = [], demandZones = [],
    alerts = [], events = [], blockages = [], refresh
  } = useFleet();

  const handleAcknowledge = async (alertId) => {
    try { await acknowledgeAlert(alertId); refresh(); } catch (e) {}
  };

  const handleClearBlockage = async (blockageId) => {
    try { await api.post('/clear-blockage', { blockage_id: blockageId }); refresh(); } catch (e) {}
  };

  const activeBlockages = (Array.isArray(blockages) ? blockages : []).filter(b => b.active);
  const activeAlerts    = alerts.filter(a => !a.acknowledged);

  const blockedRouteIds = new Set(activeBlockages.map(b => b.route_id));

  return (
    <div className="h-full w-full flex flex-col animate-fade-in bg-main">

      {/* Top Telemetry Bar */}
      <div className="px-8 py-6 bg-white border-b border-slate-100 flex items-center justify-between z-10 shrink-0 shadow-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Leaf size={14} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Live Sustainability Stream</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-accent">Network Operations Center</h2>
        </div>

        <div className="flex gap-4">
          <KPICard label="Throughput" value={metrics.passenger_throughput || '0'} unit="pax"  icon={Users}    colorClass="bg-primary/10 text-primary" />
          <KPICard label="Avg Wait"   value={metrics.average_wait_time    || '0'} unit="min"  icon={Clock}    colorClass="bg-warning/10 text-warning" />
          <KPICard label="Fleet Load" value={metrics.fleet_utilization     || '0'} unit="%"   icon={Activity} colorClass="bg-success/10 text-success" />
          <KPICard label="Energy Eff" value={metrics.system_efficiency     || '0'} unit="idx" icon={Zap}      colorClass="bg-info/10 text-info" />
        </div>

        <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
          {activeBlockages.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{activeBlockages.length} Blockage{activeBlockages.length > 1 ? 's' : ''}</span>
            </div>
          )}
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
            <Layers size={20} />
          </div>
        </div>
      </div>

      {/* Main Map Interface */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Map Area */}
        <div className="flex-1 relative">
          <LiveMap
            buses={buses}
            routes={routes}
            depots={depots}
            demandZones={demandZones}
            blockages={activeBlockages}
          />

          {/* Overlay Controls */}
          <div className="absolute top-8 left-8 z-[400] flex flex-col gap-3 max-w-xs">

            {/* Telemetry Status */}
            <div className="glass p-4 rounded-2xl flex items-center gap-4 bg-white/90 backdrop-blur-md border-slate-200">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-accent">Real-time Telemetry Active</span>
            </div>

            {/* Phase 3 — Active Blockages Overlay */}
            {activeBlockages.map(b => (
              <div key={b.blockage_id} className="glass p-4 rounded-2xl bg-red-600/90 backdrop-blur-md border-2 border-red-700 shadow-xl">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">ROUTE BLOCKED</p>
                      <p className="text-[11px] font-bold text-red-100">{b.route_name}</p>
                      <p className="text-[9px] font-bold text-red-200 uppercase">{b.reason} · Stop {b.blocked_stop_index}</p>
                      <p className="text-[9px] font-bold text-red-300 mt-0.5">
                        Clears: {b.estimated_clear_time ? new Date(b.estimated_clear_time).toLocaleTimeString() : '—'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleClearBlockage(b.blockage_id)}
                    className="shrink-0 bg-red-800/60 hover:bg-red-800 text-white rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest transition">
                    CLR
                  </button>
                </div>
              </div>
            ))}

            {/* Active City Events */}
            {events.length > 0 && events.map(event => {
              const eventColors = {
                concert:    { solid: 'bg-purple-600', border: 'border-purple-700', dot: 'bg-purple-300', text: 'text-white', iconBg: 'bg-purple-500', badge: 'bg-purple-800 text-purple-100', emoji: '🎵' },
                sports:     { solid: 'bg-blue-600',   border: 'border-blue-700',   dot: 'bg-blue-300',   text: 'text-white', iconBg: 'bg-blue-500',   badge: 'bg-blue-800 text-blue-100',     emoji: '🏏' },
                festival:   { solid: 'bg-orange-500', border: 'border-orange-600', dot: 'bg-orange-300', text: 'text-white', iconBg: 'bg-orange-400', badge: 'bg-orange-700 text-orange-100', emoji: '🎉' },
                conference: { solid: 'bg-slate-700',  border: 'border-slate-800',  dot: 'bg-slate-400',  text: 'text-white', iconBg: 'bg-slate-600',  badge: 'bg-slate-900 text-slate-100',   emoji: '💼' },
                rain:       { solid: 'bg-sky-600',    border: 'border-sky-700',    dot: 'bg-sky-300',    text: 'text-white', iconBg: 'bg-sky-500',    badge: 'bg-sky-800 text-sky-100',       emoji: '🌧️' },
              };
              const c = eventColors[event.type] || eventColors.conference;
              const minsLeft = Math.max(0, Math.round((event.end_time - Date.now()) / 60000));
              return (
                <div key={event.event_id} className={`p-4 rounded-2xl flex items-center gap-4 border-2 shadow-xl ${c.border} ${c.solid}`}>
                  <div className={`w-1 self-stretch rounded-full ${c.dot}`} />
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg}`}>
                    <span className="text-lg">{c.emoji}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${c.text}`}>{event.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${c.badge}`}>×{event.demand_multiplier} SURGE</span>
                      <span className="text-[9px] font-bold text-slate-300 uppercase">{minsLeft}m left</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts + Blockages Sidebar */}
        <div className="w-[380px] border-l border-slate-100 bg-white flex flex-col overflow-hidden">

          {/* Phase 3 — Blockages Section */}
          {activeBlockages.length > 0 && (
            <div className="border-b border-red-100 bg-red-50 shrink-0">
              <div className="px-5 py-3 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
                  <AlertTriangle size={14} /> Route Blockages
                </h3>
                <span className="text-[9px] font-black text-red-500 bg-red-100 px-2 py-0.5 rounded-full">{activeBlockages.length} ACTIVE</span>
              </div>
              <div className="px-5 pb-3 space-y-2 max-h-36 overflow-y-auto scrollbar-pro">
                {activeBlockages.map(b => (
                  <div key={b.blockage_id} className="bg-white rounded-xl p-3 border border-red-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[11px] font-black text-red-700">{b.route_name}</p>
                        <p className="text-[9px] font-bold uppercase text-red-400 tracking-widest">
                          {b.reason} · Stop {b.blocked_stop_index} · Clears {b.estimated_clear_time ? new Date(b.estimated_clear_time).toLocaleTimeString() : '—'}
                        </p>
                      </div>
                      <button onClick={() => handleClearBlockage(b.blockage_id)}
                        className="text-red-400 hover:text-red-600 transition">
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <AlertTriangle size={14} className="text-warning" /> Live Alerts
              </h3>
              <span className="text-[9px] font-black bg-warning/20 text-warning px-2 py-0.5 rounded-full">{activeAlerts.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-pro">
              {activeAlerts.length > 0 ? activeAlerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-2xl border transition-all ${
                  alert.type === 'route_blocked' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'critical'  ? 'bg-red-50/60 border-red-100' : 'bg-white border-slate-100 hover:border-warning/30'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1 pr-4">
                      <span className="text-xs font-black text-accent">{alert.message}</span>
                      <span className="text-[9px] text-text-dim font-bold uppercase tracking-widest">
                        {alert.type?.toUpperCase()} · {alert.severity?.toUpperCase()}
                      </span>
                    </div>
                    <button onClick={() => handleAcknowledge(alert.id)}
                      className="text-[10px] font-black text-primary hover:text-accent uppercase tracking-widest underline underline-offset-4 shrink-0">
                      CLR
                    </button>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center py-16 opacity-20">
                  <AlertTriangle size={36} className="text-slate-400" />
                  <p className="text-[10px] font-black mt-4 uppercase tracking-widest">No Active Alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveOps;