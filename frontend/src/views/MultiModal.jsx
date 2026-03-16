import React from 'react';
import { useFleet } from '../context/FleetContext';
import {
  TrainFront, Bus, Timer, ArrowRightLeft, Activity,
  ChevronRight, TrendingUp, MapPin, Leaf,
  AlertTriangle
} from 'lucide-react';

const MultiModal = () => {
  const { metro = {}, routeStats = [], buses = [], rickshaws = [], rickshawAssignments = [], lastMileGaps = [] } = useFleet();

  const metroStations = routeStats.slice(0, 5).map(route => ({
    name: route.name, connectivity: Math.min(100, route.load_percent + 20),
    activeBuses: route.bus_count,
    waitTime: route.frequency ? Math.round(route.frequency / 2) : 4,
    ridership: route.total_load > 1000 ? `${(route.total_load / 1000).toFixed(1)}k` : `${route.total_load}`
  }));

  const metroStatusColor = metro.status === 'delayed' ? 'text-danger' : metro.status === 'crowded' ? 'text-warning' : 'text-primary';
  const metroStatusLabel = metro.status === 'delayed' ? `Line 1: Delayed ${metro.delay_minutes} min` : metro.status === 'crowded' ? 'Line 1: Crowded' : 'Line 1 Sync: Operational';
  const metroStatusBg    = metro.status === 'delayed' ? 'border-danger/20 bg-danger/05' : metro.status === 'crowded' ? 'border-warning/20 bg-warning/05' : 'border-primary/20 bg-primary/05';
  const metroDotColor    = metro.status === 'delayed' ? 'bg-danger' : metro.status === 'crowded' ? 'bg-warning' : 'bg-primary';

  const totalRickshaws   = rickshaws.length;
  const availableRk      = rickshaws.filter(r => r.status === 'available').length;
  const busyRk           = rickshaws.filter(r => r.status === 'busy').length;
  const activeAssign     = rickshawAssignments.filter(a => a.active).length;
  const topGaps          = (lastMileGaps || []).slice(0, 4);

  const hubCounts = {};
  rickshaws.forEach(rk => { hubCounts[rk.hub_name] = (hubCounts[rk.hub_name] || 0) + 1; });

  return (
    <div className="p-8 h-full overflow-y-auto animate-fade-in flex flex-col gap-8 scrollbar-pro">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Intermodal Efficiency Agent</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-accent">Multi-Modal Integration</h1>
          <p className="text-sm text-text-muted font-medium">Hybrid Network: Metro Purple Line ↔ Feeder Bus System ↔ Auto-Rickshaws.</p>
        </div>
        <div className={`glass px-5 py-3 rounded-2xl flex items-center gap-3 ${metroStatusBg}`}>
          <div className={`w-2 h-2 rounded-full ${metroDotColor} animate-pulse`} />
          <span className={`text-[10px] font-extrabold uppercase tracking-widest ${metroStatusColor}`}>{metroStatusLabel}</span>
        </div>
      </div>

      {/* Phase 4 — Auto-Rickshaw KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Fleet', value: totalRickshaws, color: 'text-accent', bg: 'bg-slate-50', emoji: '🛺' },
          { label: 'Available',   value: availableRk,   color: 'text-emerald-600', bg: 'bg-emerald-50', emoji: '✅' },
          { label: 'On Duty',     value: busyRk,         color: 'text-amber-600', bg: 'bg-amber-50',    emoji: '🚀' },
          { label: 'Auto-Assigned', value: activeAssign, color: 'text-primary', bg: 'bg-primary/10',    emoji: '🤖' },
        ].map((kpi, i) => (
          <div key={i} className={`${kpi.bg} rounded-2xl p-5 border border-slate-100 flex items-center gap-4`}>
            <span className="text-3xl">{kpi.emoji}</span>
            <div>
              <p className={`text-2xl font-black tracking-tighter ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-text-dim">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Phase 4 — Rickshaw Hub Grid + Last-Mile Gaps */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Rickshaw Hub Status */}
        <div className="glass rounded-3xl bg-white p-8 border border-slate-100 shadow">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2 mb-6">
            <span>🛺</span> Rickshaw Hub Status
          </h3>
          <div className="space-y-4">
            {Object.entries(hubCounts).map(([hub, count]) => {
              const hubRicks = rickshaws.filter(r => r.hub_name === hub);
              const avail    = hubRicks.filter(r => r.status === 'available').length;
              const busy     = hubRicks.filter(r => r.status === 'busy').length;
              const offline  = hubRicks.filter(r => r.status === 'offline').length;
              const assignedHere = rickshawAssignments.filter(a => a.active && hubRicks.find(r => r.id === a.rickshaw_id));
              return (
                <div key={hub} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl shrink-0">🛺</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-accent truncate">{hub}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[9px] font-bold text-emerald-600">{avail} avail</span>
                      <span className="text-[9px] font-bold text-amber-600">{busy} busy</span>
                      {offline > 0 && <span className="text-[9px] font-bold text-slate-400">{offline} offline</span>}
                    </div>
                  </div>
                  {assignedHere.length > 0 && (
                    <div className="bg-primary/10 text-primary text-[9px] font-black px-2 py-1 rounded-lg shrink-0 border border-primary/20">
                      🤖 DEMAND SURGE
                    </div>
                  )}
                  <div className="flex gap-1 shrink-0">
                    {hubRicks.slice(0, 5).map(rk => (
                      <div key={rk.id} className={`w-2 h-2 rounded-full ${
                        rk.status === 'available' ? 'bg-emerald-500' :
                        rk.status === 'busy'      ? 'bg-amber-500'   : 'bg-slate-300'
                      }`} title={rk.id} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Last-Mile Coverage Gaps */}
        <div className="glass rounded-3xl bg-white p-8 border border-slate-100 shadow">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-500" /> Last-Mile Coverage Gaps
          </h3>
          <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-6">Zones &gt;500m from nearest bus/metro</p>
          {topGaps.length > 0 ? (
            <div className="space-y-4">
              {topGaps.map((gap, i) => (
                <div key={gap.zone_id} className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-accent">{gap.zone_name}</span>
                    <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{gap.gap_km}km gap</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[9px] font-bold text-text-dim">Bus: {gap.nearest_bus_km}km</span>
                    <span className="text-[9px] font-bold text-text-dim">Metro: {gap.nearest_metro_km}km</span>
                    <span className="text-[9px] font-bold text-text-dim ml-auto">Demand: {gap.current_demand}</span>
                  </div>
                  {/* Rickshaw coverage bar */}
                  <div className="mt-3">
                    <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (1 / gap.gap_km) * 100)}%` }} />
                    </div>
                    <p className="text-[8px] font-bold text-amber-600 mt-1 uppercase tracking-widest">Rickshaw coverage active</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 opacity-40">
              <span className="text-4xl mb-3">✅</span>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-dim text-center">All zones within 500m coverage radius</p>
            </div>
          )}
        </div>
      </div>

      {/* Metro Line Visual Controller */}
      <div className="glass p-10 rounded-3xl relative overflow-hidden border-primary/10 bg-white shadow-lg">
        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-12">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <TrainFront size={32} />
            </div>
            <div>
              <h3 className="font-bold text-2xl tracking-tight text-accent">Mainline Purple Corridor</h3>
              <div className="flex gap-6 mt-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                  <Activity size={12} className="text-primary" /> 14.5 km span
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                  <Timer size={12} className="text-primary" /> 32 min transit
                </span>
              </div>
            </div>
          </div>

          <div className="relative py-14 px-8">
            <div className="absolute top-1/2 left-0 w-full h-[8px] bg-slate-100 -translate-y-1/2 rounded-full" />
            <div className="absolute top-1/2 left-0 w-[65%] h-[8px] bg-primary -translate-y-1/2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
            <div className="relative flex justify-between items-center">
              {['Vanaz', 'Ideal', 'Nal Stop', 'Garware', 'PMC', 'Civic', 'Station', 'Ramwadi'].map((st, i) => (
                <div key={st} className="flex flex-col items-center group cursor-pointer relative">
                  <div className={`w-6 h-6 rounded-full border-[4px] border-white z-10 transition-all duration-300 group-hover:scale-125 shadow-sm ${i < 6 ? 'bg-primary' : 'bg-slate-200'}`} />
                  <div className="absolute top-10 flex flex-col items-center whitespace-nowrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-dim group-hover:text-primary transition-all">{st}</span>
                    <span className="text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-all">4m WAIT</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {metro.status !== 'normal' && metro.status && (
        <div className={`px-8 py-4 rounded-2xl flex items-center gap-4 border ${metro.status === 'delayed' ? 'bg-danger/05 border-danger/20' : 'bg-warning/05 border-warning/20'}`}>
          <Activity size={16} className={metro.status === 'delayed' ? 'text-danger' : 'text-warning'} />
          <p className="text-xs font-black uppercase tracking-widest">
            {metro.status === 'delayed'
              ? `Metro delayed by ${metro.delay_minutes} min — bus demand in nearby zones increased`
              : 'Metro crowded — feeder bus load elevated across interchange zones'}
          </p>
          <span className={`ml-auto text-[10px] font-black px-3 py-1 rounded-full ${metro.status === 'delayed' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>LIVE</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
              <MapPin size={14} className="text-primary" /> Hub Connectivity Ranking
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {metroStations.map(station => (
              <div key={station.name} className="glass p-8 rounded-3xl group hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center gap-10">
                <div className="flex items-center gap-5 min-w-[200px]">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20">
                    {station.connectivity}%
                  </div>
                  <div>
                    <h4 className="font-black text-lg tracking-tight text-accent">{station.name}</h4>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">Interchange Zone</p>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-8 py-4 border-t border-slate-100 md:border-t-0 md:border-l md:pl-10">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-black text-accent uppercase tracking-tight">{station.activeBuses} Units</span>
                    <span className="text-[9px] text-text-dim font-bold uppercase tracking-widest">Feeder Buses</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-tight">~{station.waitTime} min</span>
                    <span className="text-[9px] text-text-dim font-bold uppercase tracking-widest">Avg Wait Time</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-black text-primary uppercase tracking-tight">{station.ridership}</span>
                    <span className="text-[9px] text-text-dim font-bold uppercase tracking-widest">Daily Passenger Flow</span>
                  </div>
                </div>
                <button className="hidden md:flex p-3 rounded-xl bg-slate-50 text-text-dim hover:text-primary hover:bg-primary/10 transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" /> SDG Strategic Insights
          </h3>
          <div className="glass p-8 rounded-3xl flex-1 flex flex-col gap-12 bg-white">
            {[
              { label: 'Feeder coverage radius', value: '82%', change: '+4%', pct: 82, color: 'bg-primary' },
              { label: 'Scheduling alignment',  value: '91%', change: '+1.2%', pct: 91, color: 'bg-emerald-500' },
              { label: 'Rickshaw last-mile fill', value: `${Math.max(0, 100 - (lastMileGaps.length * 8))}%`, change: 'live', pct: Math.max(0, 100 - (lastMileGaps.length * 8)), color: 'bg-amber-500' },
            ].map(stat => (
              <div key={stat.label} className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">{stat.label}</span>
                  <span className="text-2xl font-black tracking-tighter text-accent">{stat.value} <span className="text-primary text-[10px] font-black">{stat.change}</span></span>
                </div>
                <div className="progress-container">
                  <div className={`progress-fill ${stat.color} shadow-sm`} style={{ width: `${stat.pct}%` }} />
                </div>
              </div>
            ))}
            <div className="mt-auto p-6 rounded-2xl bg-primary/05 border border-primary/10">
              <div className="flex items-center gap-3 mb-4">
                <ArrowRightLeft size={20} className="text-primary" />
                <h4 className="font-extrabold text-sm text-accent uppercase tracking-tight">AI Synchronization Active</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-text-muted font-medium">
                AI dynamically shifts feeder + rickshaw schedules to align with Metro Line 1.
                Reduces hub congestion — contributing to <span className="text-primary font-bold">Goal 11.2</span>: Safe, affordable, accessible transport systems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiModal;
