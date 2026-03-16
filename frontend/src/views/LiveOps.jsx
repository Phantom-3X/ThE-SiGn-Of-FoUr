import React, { useState } from 'react';
import LiveMap from '../components/LiveMap';
import KPICard from '../components/KPICard';
import AlertsSidebar from '../components/AlertsSidebar';
import { useFleet } from '../context/FleetContext';
import { acknowledgeAlert } from '../services/api';
import { 
  Users, 
  Clock, 
  Activity, 
  Zap,
  Leaf,
  Layers,
  Fuel,
  Route,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const LiveOps = () => {
  const { metrics = {}, buses = [], routes = [], autoRikshawRoutes = [], autoRikshaws = [], depots = [], demandZones = [], alerts = [], events = [], refresh } = useFleet();
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState(false);

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
      refresh();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

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

        {/* KPI Grid - Horizontal Ribbon */}
        <div className="flex gap-4">
          <KPICard
            label="Throughput"
            value={metrics.passenger_throughput || '0'}
            unit="pax"
            icon={Users}
            colorClass="bg-primary/10 text-primary"
          />
          <KPICard
            label="Avg Wait"
            value={metrics.average_wait_time || '0'}
            unit="min"
            icon={Clock}
            colorClass="bg-warning/10 text-warning"
          />
          <KPICard
            label="Fleet Load"
            value={metrics.fleet_utilization || '0'}
            unit="%"
            icon={Activity}
            colorClass="bg-success/10 text-success"
          />
          <KPICard
            label="Fuel Used"
            value={metrics.total_fuel_consumed ? metrics.total_fuel_consumed.toFixed(1) : '0'}
            unit="L"
            icon={Fuel}
            colorClass="bg-emerald-500/10 text-emerald-600"
          />
          <KPICard
            label="Empty KMs"
            value={metrics.empty_distance_km ? metrics.empty_distance_km.toFixed(1) : '0'}
            unit="km"
            icon={Route}
            colorClass="bg-amber-500/10 text-amber-600"
          />
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
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
            autoRikshawRoutes={autoRikshawRoutes}
            autoRikshaws={autoRikshaws}
            depots={depots}
            demandZones={demandZones}
            events={events}
          />

          {/* Map Overlay Controls */}
          <div className="absolute top-8 left-8 z-[400] flex flex-col gap-3">

            {/* Telemetry Status */}
            <div className="glass p-4 rounded-2xl flex items-center gap-4 bg-white/90 backdrop-blur-md border-slate-200">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-accent">Real-time Telemetry Active</span>
            </div>

            {/* Active City Events */}
            {events.length > 0 && events.map(event => {
              const eventColors = {
                concert:    { 
                  solid: 'bg-purple-600', border: 'border-purple-700', 
                  dot: 'bg-purple-300', text: 'text-white', 
                  iconBg: 'bg-purple-500', badge: 'bg-purple-800 text-purple-100',
                  emoji: '🎵'
                },
                sports:     { 
                  solid: 'bg-blue-600', border: 'border-blue-700', 
                  dot: 'bg-blue-300', text: 'text-white', 
                  iconBg: 'bg-blue-500', badge: 'bg-blue-800 text-blue-100',
                  emoji: '🏏'
                },
                festival:   { 
                  solid: 'bg-orange-500', border: 'border-orange-600', 
                  dot: 'bg-orange-300', text: 'text-white', 
                  iconBg: 'bg-orange-400', badge: 'bg-orange-700 text-orange-100',
                  emoji: '🎉'
                },
                conference: { 
                  solid: 'bg-slate-700', border: 'border-slate-800', 
                  dot: 'bg-slate-400', text: 'text-white', 
                  iconBg: 'bg-slate-600', badge: 'bg-slate-900 text-slate-100',
                  emoji: '💼'
                },
                rain:       { 
                  solid: 'bg-sky-600', border: 'border-sky-700', 
                  dot: 'bg-sky-300', text: 'text-white', 
                  iconBg: 'bg-sky-500', badge: 'bg-sky-800 text-sky-100',
                  emoji: '🌧️'
                },
              };
              const c = eventColors[event.type] || eventColors.conference;
              const minsLeft = Math.max(0, Math.round((event.end_time - Date.now()) / 60000));

              return (
                <div key={event.event_id} className={`p-4 rounded-2xl flex items-center gap-4 border-2 shadow-xl ${c.border} ${c.solid}`}>
                  {/* Colored left accent strip */}
                  <div className={`w-1 self-stretch rounded-full ${c.dot}`}></div>

                  {/* Pulsing icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg}`}>
                    <span className="text-lg">{c.emoji}</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${c.text}`}>
                      {event.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${c.badge}`}>
                        ×{event.demand_multiplier} SURGE
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        {minsLeft}m left
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Map Index / Legend */}
            <div className="glass rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg overflow-hidden w-[340px]">
              <button
                onClick={() => setIsLegendMinimized(prev => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <span className="text-[11px] font-black uppercase tracking-widest text-accent">Map Index</span>
                {isLegendMinimized ? (
                  <ChevronDown size={16} className="text-slate-500" />
                ) : (
                  <ChevronUp size={16} className="text-slate-500" />
                )}
              </button>

              {!isLegendMinimized && (
                <div className="px-4 pb-4 pt-1 flex flex-col gap-4">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Traffic Congestion</h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Free Flow
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        Moderate
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        Heavy
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                        Blocked Route / Detour Active
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200"></div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Bus Status Colors</h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Active (Normal)
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        Underutilized (&lt;30%)
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        Busy (&gt;60% Load)
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        Crowded (&gt;85% Load)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
          {/* End Map Overlay Controls */}

        </div>
        {/* End Map Area */}

        {/* Alerts Sidebar */}
        <div className={`${isAlertsCollapsed ? 'w-[56px]' : 'w-[380px]'} border-l border-slate-100 bg-white relative transition-all duration-300`}>
          <button
            onClick={() => setIsAlertsCollapsed(prev => !prev)}
            className="absolute top-4 -left-4 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-accent transition-colors"
            aria-label={isAlertsCollapsed ? 'Expand alerts' : 'Collapse alerts'}
          >
            {isAlertsCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {isAlertsCollapsed ? (
            <div className="h-full flex flex-col items-center justify-start pt-16 gap-4">
              <div className="rotate-180 [writing-mode:vertical-rl] text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                Live Alerts
              </div>
              <span className="bg-danger text-white text-[9px] px-2 py-1 rounded-full font-black">
                {alerts.filter(a => !a.acknowledged).length}
              </span>
            </div>
          ) : (
            <AlertsSidebar alerts={alerts} onAcknowledge={handleAcknowledge} />
          )}
        </div>

      </div>
      {/* End Main Map Interface */}

    </div>
  );
};

export default LiveOps;