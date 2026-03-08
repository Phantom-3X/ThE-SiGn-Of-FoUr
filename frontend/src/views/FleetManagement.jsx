import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { 
  Search, 
  Filter, 
  Bus, 
  Battery, 
  MoreVertical,
  Activity,
  ArrowUpDown,
  Zap,
  Leaf
} from 'lucide-react';

const FleetManagement = () => {
  const { buses = [], refresh } = useFleet();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBuses = buses.filter(bus => 
    bus.bus_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.current_route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'on_time': return 'text-success';
      case 'delayed': return 'text-warning';
      case 'overcrowded': return 'text-danger';
      default: return 'text-dim';
    }
  };

  return (
    <div className="p-8 h-full flex flex-col gap-8 animate-fade-in overflow-hidden bg-main">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Zero Emission Fleet Core</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-accent">Fleet Management Console</h1>
          <p className="text-sm text-text-muted font-medium">Real-time health & occupancy state across {buses.length} active vehicles.</p>
        </div>
        <div className="flex gap-4">
           <div className="glass px-5 py-2.5 rounded-2xl flex items-center gap-4 border-slate-200 bg-white">
            <Search size={18} className="text-slate-300" />
            <input 
              type="text" 
              placeholder="Search ID, Route..." 
              className="bg-transparent border-none text-xs focus:outline-none w-56 font-bold text-accent placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary-ghost">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      <div className="flex-1 glass rounded-3xl overflow-hidden relative border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto h-full scrollbar-pro">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-text-dim">
                  <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                    Vehicle ID <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-text-dim">Current Route</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-text-dim">Ops Status</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-text-dim">Live Occupancy</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-text-dim">Battery</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-text-dim">Signal</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-text-dim text-center">Managed Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBuses.map((bus) => {
                const capacity = bus.capacity || bus.max_capacity || 60;
                const occupancyPercent = Math.min(Math.round((bus.current_occupancy / capacity) * 100), 100);
                
                return (
                  <tr key={bus.bus_id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/10">
                          <Bus size={18} />
                        </div>
                        <span className="font-black text-sm tracking-tight text-accent">{bus.bus_id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-accent">{bus.current_route}</span>
                        <span className="text-[10px] text-text-dim uppercase font-black tracking-widest mt-0.5">Pune Integrated Network</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest ${getStatusColor(bus.status)}`}>
                        <div className="relative">
                          <div className={`w-2 h-2 rounded-full ${bus.status === 'on_time' ? 'bg-success' : bus.status === 'delayed' ? 'bg-warning' : 'bg-danger'}`}></div>
                          <div className={`absolute -inset-1 rounded-full opacity-30 animate-pulse ${bus.status === 'on_time' ? 'bg-success' : bus.status === 'delayed' ? 'bg-warning' : 'bg-danger'}`}></div>
                        </div>
                        {bus.status?.replace('_', ' ') || 'ACTIVE'}
                      </div>
                    </td>
                    <td className="px-8 py-5 w-[250px]">
                      <div className="flex flex-col gap-2.5">
                        <div className="flex justify-between items-end">
                          <span className={`text-[11px] font-black ${occupancyPercent > 85 ? 'text-danger' : 'text-primary'}`}>{occupancyPercent}% Load</span>
                          <span className="text-[9px] text-text-dim font-black uppercase tracking-tighter">{bus.current_occupancy} / {capacity} PAX</span>
                        </div>
                        <div className="progress-container h-[6px]">
                          <div 
                            className={`progress-fill ${occupancyPercent > 85 ? 'bg-danger' : 'bg-primary'}`} 
                            style={{ width: `${occupancyPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2.5 text-xs font-black text-slate-500">
                        <Battery size={16} className={bus.battery < 20 ? 'text-danger animate-pulse' : 'text-success'} />
                        {bus.battery || (Math.floor(Math.random() * 40) + 60)}%
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-success uppercase tracking-widest flex items-center gap-1.5">
                        <Zap size={10} fill="currentColor" /> Live
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-accent transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredBuses.length === 0 && (
            <div className="p-32 flex flex-col items-center justify-center opacity-30 text-center">
              <Activity size={80} className="mb-6 text-slate-300" />
              <p className="font-black uppercase tracking-[0.3em] text-lg text-slate-400">Diagnostic: Fleet Search Failure</p>
              <p className="text-xs mt-2 font-bold text-slate-400 uppercase">No active units match the query.</p>
            </div>
          )}
        </div>
      </div>

      {/* SDG Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Network Coverage', value: '42 Routes', trend: '+2', icon: Activity },
          { label: 'Avg Frequency', value: '8.5 min', trend: '-0.2', icon: Zap },
          { label: 'Active Drivers', value: '482', trend: '+12', icon: Leaf }
        ].map((stat, i) => (
          <div key={i} className="glass px-8 py-6 rounded-3xl flex items-center justify-between bg-white border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-dim mb-1 block">{stat.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black tracking-tighter text-accent">{stat.value}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stat.trend.startsWith('+') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  {stat.trend}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 text-slate-300">
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FleetManagement;
