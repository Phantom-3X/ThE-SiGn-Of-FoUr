import React, { useMemo } from 'react';
import { useFleet } from '../context/FleetContext';
import { 
  TrainFront, 
  Timer, 
  ArrowRightLeft,
  Activity,
  ChevronRight,
  TrendingUp,
  MapPin,
  Leaf,
  Gauge,
  Sparkles
} from 'lucide-react';

const MultiModal = () => {
  const { metro = {}, routeStats = [], autoRikshawRoutes = [], autoRikshaws = [], events = [] } = useFleet();
  
  // Try to derive hub connectivity from real routeStats if possible
  // For now, structure with real data mappings
  // Derive hub data from real routeStats
const metroStations = routeStats.slice(0, 5).map(route => ({
    name: route.name,
    connectivity: Math.min(100, route.load_percent + 20),
    activeBuses: route.bus_count,
    waitTime: route.frequency ? Math.round(route.frequency / 2) : 4,
    ridership: route.total_load > 1000
        ? `${(route.total_load / 1000).toFixed(1)}k`
        : `${route.total_load}`
}));

// Metro status derived from real metro state
const metroStatusColor = metro.status === 'delayed' ? 'text-danger' :
    metro.status === 'crowded' ? 'text-warning' : 'text-primary';

const metroStatusLabel = metro.status === 'delayed'
    ? `Line 1: Delayed ${metro.delay_minutes} min`
    : metro.status === 'crowded'
    ? 'Line 1: Crowded'
    : 'Line 1 Sync: Operational';

const metroStatusBg = metro.status === 'delayed' ? 'border-danger/20 bg-danger/05' :
    metro.status === 'crowded' ? 'border-warning/20 bg-warning/05' :
    'border-primary/20 bg-primary/05';

const metroDotColor = metro.status === 'delayed' ? 'bg-danger' :
    metro.status === 'crowded' ? 'bg-warning' : 'bg-primary';

  const activeEventIds = useMemo(
    () => new Set(events.filter(event => event.active).map(event => event.event_id)),
    [events]
  );

  const autoStandStats = useMemo(() => {
    return autoRikshawRoutes.map(route => {
      const routeRikshaws = autoRikshaws.filter(rikshaw => rikshaw.route_id === route.route_id);
      const totalCapacity = routeRikshaws.reduce((sum, rikshaw) => sum + (rikshaw.capacity || 0), 0);
      const availableSeats = routeRikshaws.reduce((sum, rikshaw) => sum + Math.max(0, (rikshaw.capacity || 0) - (rikshaw.current_load || 0)), 0);
      const totalTrips = routeRikshaws.reduce((sum, rikshaw) => sum + (rikshaw.completed_trips || 0), 0);
      const eventAssignments = routeRikshaws.filter(rikshaw => rikshaw.event_mission && activeEventIds.has(rikshaw.event_mission.event_id)).length;
      const availabilityRatio = totalCapacity > 0 ? availableSeats / totalCapacity : 0;
      const estimatedWait = routeRikshaws.length > 0
        ? Math.max(1, Math.round((route.avg_trip_minutes || 12) / Math.max(2, routeRikshaws.length * 1.5)))
        : route.avg_trip_minutes || 0;

      let status = 'busy';
      if (availabilityRatio >= 0.55) status = 'active';
      else if (availabilityRatio >= 0.25) status = 'low';

      return {
        route_id: route.route_id,
        name: `${route.name.split('↔')[0]?.trim() || route.name} Auto Stand`,
        totalCapacity,
        availableSeats,
        availabilityRatio,
        estimatedWait,
        totalTrips,
        eventAssignments,
        status
      };
    });
  }, [autoRikshawRoutes, autoRikshaws, activeEventIds]);

  const autoSummary = useMemo(() => {
    const totalAvailable = autoStandStats.reduce((sum, stand) => sum + stand.availableSeats, 0);
    const totalCapacity = autoStandStats.reduce((sum, stand) => sum + stand.totalCapacity, 0);
    const activeStands = autoStandStats.filter(stand => stand.availableSeats > 0).length;
    const fleetAvailability = totalCapacity > 0 ? Math.round((totalAvailable / totalCapacity) * 100) : 0;
    return { totalAvailable, totalCapacity, activeStands, fleetAvailability };
  }, [autoStandStats]);

  const standStatusConfig = {
    active: {
      label: 'Active',
      badge: 'bg-emerald-100 text-emerald-700',
      border: 'border-emerald-200',
      bar: 'bg-emerald-500'
    },
    low: {
      label: 'Low',
      badge: 'bg-amber-100 text-amber-700',
      border: 'border-amber-200',
      bar: 'bg-amber-500'
    },
    busy: {
      label: 'Busy',
      badge: 'bg-red-100 text-red-700',
      border: 'border-red-200',
      bar: 'bg-red-500'
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto animate-fade-in flex flex-col gap-8 scrollbar-pro">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Intermodal Efficiency Agent</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-accent">Multi-Modal Integration</h1>
          <p className="text-sm text-text-muted font-medium">Hybrid Network: Metro Purple Line ↔ Feeder Bus System synchronization.</p>
        </div>
        <div className={`glass px-5 py-3 rounded-2xl flex items-center gap-3 ${metroStatusBg}`}>
          <div className={`w-2 h-2 rounded-full ${metroDotColor} animate-pulse`}></div>
          <span className={`text-[10px] font-extrabold uppercase tracking-widest ${metroStatusColor}`}>
              {metroStatusLabel}
          </span>
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
                  <div className="absolute top-1/2 left-0 w-full h-[8px] bg-slate-100 -translate-y-1/2 rounded-full"></div>
                  <div className="absolute top-1/2 left-0 w-[65%] h-[8px] bg-primary -translate-y-1/2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
                  
                  <div className="relative flex justify-between items-center">
                    {['Vanaz', 'Ideal', 'Nal Stop', 'Garware', 'PMC', 'Civic', 'Station', 'Ramwadi'].map((st, i) => (
                      <div key={st} className="flex flex-col items-center group cursor-pointer relative">
                        <div className={`w-6 h-6 rounded-full border-[4px] border-white z-10 transition-all duration-300 group-hover:scale-125 shadow-sm ${i < 6 ? 'bg-primary' : 'bg-slate-200'}`}></div>
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

{/* Metro Disruption Warning — only shows when metro is not normal */}
{metro.status !== 'normal' && metro.status && (
    <div className={`px-8 py-4 rounded-2xl flex items-center gap-4 border ${
        metro.status === 'delayed' ? 'bg-danger/05 border-danger/20' : 'bg-warning/05 border-warning/20'
    }`}>
        <Activity size={16} className={metro.status === 'delayed' ? 'text-danger' : 'text-warning'} />
        <p className="text-xs font-black uppercase tracking-widest">
            {metro.status === 'delayed'
                ? `Metro delayed by ${metro.delay_minutes} min — bus demand in nearby zones increased`
                : 'Metro crowded — feeder bus load elevated across interchange zones'
            }
        </p>
        <span className={`ml-auto text-[10px] font-black px-3 py-1 rounded-full ${
            metro.status === 'delayed' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
        }`}>
            LIVE
        </span>
    </div>
)}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-4">
        {/* Connection Hubs - FIXED GRID FOR READABILITY */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
              <MapPin size={14} className="text-primary" /> Hub Connectivity Ranking
            </h3>
            <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Efficiency Metrics Optimized</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {metroStations.map((station) => (
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
                
                {/* Metrics Grid - THE FIX */}
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

        {/* Sync Insights Column */}
        <div className="flex flex-col gap-6">
           <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" /> SDG Strategic Insights
          </h3>
          
          <div className="glass p-8 rounded-3xl flex-1 flex flex-col gap-12 bg-white">
            <div className="space-y-4">
               <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Feeder coverage radius</span>
                <span className="text-2xl font-black tracking-tighter text-accent">82% <span className="text-primary text-[10px] font-black">+4%</span></span>
               </div>
               <div className="progress-container">
                <div className="progress-fill bg-primary shadow-sm" style={{ width: '82%' }}></div>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Scheduling alignment</span>
                <span className="text-2xl font-black tracking-tighter text-accent">91% <span className="text-primary text-[10px] font-black">+1.2%</span></span>
               </div>
               <div className="progress-container">
                <div className="progress-fill bg-emerald-500 shadow-sm" style={{ width: '91%' }}></div>
               </div>
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-primary/05 border border-primary/10">
               <div className="flex items-center gap-3 mb-4">
                 <ArrowRightLeft size={20} className="text-primary" />
                 <h4 className="font-extrabold text-sm text-accent uppercase tracking-tight">AI Synchronization Active</h4>
               </div>
               <p className="text-[11px] leading-relaxed text-text-muted font-medium">
                 AI is dynamically shifting feeder schedules to align with Metro Line 1 headers. This reduces hub congestion and contributes to <span className="text-primary font-bold">Goal 11.2</span>: Safe, affordable, accessible and sustainable transport systems.
               </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass p-8 rounded-[2rem] border-primary/10 bg-white shadow-lg flex flex-col gap-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-accent">Last-Mile Auto-Rickshaw Network</h2>
            <p className="text-[11px] font-black uppercase tracking-widest text-text-dim mt-2">Real-time feeder coverage at key interchange zones</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100">
            <Sparkles size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Simulator-driven auto network telemetry</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {autoStandStats.map(stand => {
            const cfg = standStatusConfig[stand.status] || standStatusConfig.low;
            return (
              <div key={stand.route_id} className={`rounded-3xl border bg-white shadow-sm p-6 flex flex-col gap-5 ${cfg.border}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-2xl border border-amber-100">
                      <span aria-hidden="true">🛺</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wide text-accent leading-tight">{stand.name}</h3>
                      <span className={`inline-flex mt-2 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black tracking-tighter text-accent">{stand.availableSeats}</span>
                  <span className="text-sm font-black text-text-dim">/ {stand.totalCapacity}</span>
                </div>

                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${Math.min(100, Math.round(stand.availabilityRatio * 100))}%` }}></div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-dim">
                  <span>~{stand.estimatedWait} min wait</span>
                  <span>{stand.totalTrips} trips</span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-dim border-t border-slate-100 pt-4">
                  <span>{stand.route_id}</span>
                  <span>{stand.eventAssignments} on event duty</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl bg-slate-50 border border-slate-100 px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Total Available</span>
            <p className="text-3xl font-black tracking-tighter text-accent mt-2">{autoSummary.totalAvailable}</p>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Total Capacity</span>
            <p className="text-3xl font-black tracking-tighter text-accent mt-2">{autoSummary.totalCapacity}</p>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Fleet Availability</span>
            <p className="text-3xl font-black tracking-tighter text-primary mt-2">{autoSummary.fleetAvailability}%</p>
          </div>
          <div className="flex items-center justify-between md:justify-end">
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Active Stands</span>
              <p className="text-3xl font-black tracking-tighter text-accent mt-2">{autoSummary.activeStands}</p>
            </div>
            <div className="ml-4 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
              <Gauge size={26} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiModal;
