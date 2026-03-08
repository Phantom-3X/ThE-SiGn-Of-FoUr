import React from 'react';
import { useFleet } from '../context/FleetContext';
import { 
  TrainFront, 
  Bus, 
  Timer, 
  ArrowRightLeft,
  Activity,
  ChevronRight,
  TrendingUp,
  MapPin,
  Leaf
} from 'lucide-react';

const MultiModal = () => {
  const { metro = {}, routeStats = [] } = useFleet();
  
  // Try to derive hub connectivity from real routeStats if possible
  // For now, structure with real data mappings
  const metroStations = [
    { name: 'Vanaz', connectivity: 85, activeBuses: 12, waitTime: 4, ridership: '2.4k' },
    { name: 'Ramwadi', connectivity: 92, activeBuses: 18, waitTime: 2, ridership: '3.8k' },
    { name: 'Swargate', connectivity: 78, activeBuses: 24, waitTime: 6, ridership: '5.2k' },
    { name: 'PMC Hub', connectivity: 88, activeBuses: 10, waitTime: 3, ridership: '1.9k' },
    { name: 'Pune Station', connectivity: 95, activeBuses: 32, waitTime: 2, ridership: '8.4k' },
  ];

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
        <div className="glass px-5 py-3 rounded-2xl flex items-center gap-3 border-primary/20 bg-primary/05">
           <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
           <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Line 1 Sync: Operational</span>
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
    </div>
  );
};

export default MultiModal;
