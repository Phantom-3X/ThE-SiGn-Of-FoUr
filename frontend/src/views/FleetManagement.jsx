import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { getBusDetails } from '../services/api';
import { 
  Search, 
  Filter, 
  Bus, 
  Battery, 
  MoreVertical,
  Activity,
  ArrowUpDown,
  Zap,
  Leaf,
  X,
  MapPin,
  TrendingUp,
  Clock
} from 'lucide-react';

const FleetManagement = () => {
  const { buses = [], routes = [], metrics = {}, refresh } = useFleet();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);
  const [busDetail, setBusDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleBusClick = async (bus) => {
    setSelectedBus(bus);
    setDetailLoading(true);
    try {
      const res = await getBusDetails(bus.bus_id);
      setBusDetail(res.data);
    } catch (err) {
      setBusDetail(bus);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedBus(null);
    setBusDetail(null);
  };

  const filteredBuses = buses.filter(bus => 
    bus.bus_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.route_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'text-success';
      case 'underutilized': return 'text-warning';
      case 'crowded': return 'text-danger';
      default: return 'text-dim';
    }
  };

  return (
    <div className="p-8 h-full flex flex-col gap-8 animate-fade-in overflow-hidden bg-main">

      {/* Header */}
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

      {/* Table */}
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
                const capacity = bus.capacity || 50;
                const occupancyPercent = Math.min(Math.round((bus.current_load / capacity) * 100), 100);
                const battery = 60 + (parseInt(bus.bus_id.replace('BUS', '')) % 40);

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
                        <span className="text-sm font-black text-accent">{bus.route_id}</span>
                        {bus.auto_reroute ? (
                          <span className="text-[9px] text-violet-600 uppercase font-black tracking-widest mt-0.5">
                            Support from {bus.auto_reroute.original_route_id}
                          </span>
                        ) : (
                        <span className="text-[10px] text-text-dim uppercase font-black tracking-widest mt-0.5">Pune Integrated Network</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest ${getStatusColor(bus.status)}`}>
                        <div className="relative">
                          <div className={`w-2 h-2 rounded-full ${bus.status === 'active' ? 'bg-success' : bus.status === 'underutilized' ? 'bg-warning' : 'bg-danger'}`}></div>
                          <div className={`absolute -inset-1 rounded-full opacity-30 animate-pulse ${bus.status === 'active' ? 'bg-success' : bus.status === 'underutilized' ? 'bg-warning' : 'bg-danger'}`}></div>
                        </div>
                        {bus.status?.replace('_', ' ') || 'ACTIVE'}
                      </div>
                    </td>
                    <td className="px-8 py-5 w-[250px]">
                      <div className="flex flex-col gap-2.5">
                        <div className="flex justify-between items-end">
                          <span className={`text-[11px] font-black ${occupancyPercent > 85 ? 'text-danger' : 'text-primary'}`}>{occupancyPercent}% Load</span>
                          <span className="text-[9px] text-text-dim font-black uppercase tracking-tighter">{bus.current_load} / {capacity} PAX</span>
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
                        <Battery size={16} className={battery < 20 ? 'text-danger animate-pulse' : 'text-success'} />
                        {battery}%
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-success uppercase tracking-widest flex items-center gap-1.5">
                        <Zap size={10} fill="currentColor" /> Live
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button
                        onClick={() => handleBusClick(bus)}
                        className="p-2.5 rounded-xl hover:bg-primary/10 hover:text-primary text-slate-400 transition-all"
                      >
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
          { 
            label: 'Network Coverage', 
            value: `${routes.length} Routes`, 
            trend: '+2', 
            icon: Activity 
          },
          { 
            label: 'Avg Frequency', 
            value: metrics.average_wait_time ? `${(metrics.average_wait_time * 2).toFixed(1)} min` : '— min', 
            trend: '-0.2', 
            icon: Zap 
          },
          { 
            label: 'Active Vehicles', 
            value: `${buses.length}`, 
            trend: `+${Math.max(0, buses.length - 50)}`, 
            icon: Leaf 
          }
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

      {/* Bus Detail Slide-in Panel */}
      {selectedBus && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={closeDetail}
          ></div>

          {/* Panel */}
          <div className="relative w-[420px] h-full bg-white shadow-2xl flex flex-col z-10 animate-fade-in">

            {/* Panel Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/10">
                  <Bus size={22} />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight text-accent">{selectedBus.bus_id}</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Vehicle Detail</span>
                </div>
              </div>
              <button
                onClick={closeDetail}
                className="p-2.5 rounded-xl hover:bg-slate-200 text-slate-400 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 scrollbar-pro">
              {detailLoading ? (
                <div className="flex-1 flex items-center justify-center opacity-30">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                </div>
              ) : busDetail ? (
                <>
                  {/* Status Card */}
                  <div className={`p-6 rounded-2xl border-2 ${
                    busDetail.status === 'crowded' ? 'bg-danger/05 border-danger/20' :
                    busDetail.status === 'underutilized' ? 'bg-warning/05 border-warning/20' :
                    'bg-success/05 border-success/20'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Ops Status</span>
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                        busDetail.status === 'crowded' ? 'bg-danger/10 text-danger' :
                        busDetail.status === 'underutilized' ? 'bg-warning/10 text-warning' :
                        'bg-success/10 text-success'
                      }`}>
                        {busDetail.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <span className="text-[11px] font-black text-text-dim uppercase tracking-widest">Load</span>
                        <span className="text-[11px] font-black text-accent">{busDetail.current_load} / {busDetail.capacity} PAX</span>
                      </div>
                      <div className="progress-container h-2">
                        <div
                          className={`progress-fill ${(busDetail.load_percent ?? Math.round((busDetail.current_load / busDetail.capacity) * 100)) > 85 ? 'bg-danger' : 'bg-primary'}`}
                          style={{ width: `${busDetail.load_percent ?? Math.round((busDetail.current_load / busDetail.capacity) * 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-lg font-black tracking-tighter ${(busDetail.load_percent ?? 0) > 85 ? 'text-danger' : 'text-primary'}`}>
                        {busDetail.load_percent ?? Math.round((busDetail.current_load / busDetail.capacity) * 100)}% Load
                      </span>
                    </div>
                  </div>

                  {/* Route Info */}
                  <div className="glass p-6 rounded-2xl bg-white border border-slate-100 flex flex-col gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Route Assignment</span>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <TrendingUp size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-accent">{busDetail.route_name || busDetail.route_id}</p>
                        <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Route ID: {busDetail.route_id}</p>
                      </div>
                    </div>
                    {busDetail.auto_reroute && (
                      <div className="mt-1 p-4 rounded-xl bg-violet-50 border border-violet-200 flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-violet-700">Temporary Support Assignment</span>
                        <span className="text-xs font-bold text-violet-900">Supporting crowded route {busDetail.route_id}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Original route: {busDetail.auto_reroute.original_route_id}</span>
                      </div>
                    )}
                  </div>

                  {/* Position */}
                  <div className="glass p-6 rounded-2xl bg-white border border-slate-100 flex flex-col gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Live Position</span>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-info/10 text-info">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-accent font-mono">
                          {busDetail.lat?.toFixed(4)}, {busDetail.lng?.toFixed(4)}
                        </p>
                        <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">GPS Coordinates</p>
                      </div>
                    </div>
                  </div>

                  {/* Battery & Signal */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass p-6 rounded-2xl bg-white border border-slate-100 flex flex-col gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Battery</span>
                      <div className="flex items-center gap-2">
                        <Battery size={20} className="text-success" />
                        <span className="text-2xl font-black tracking-tighter text-accent">
                          {60 + (parseInt(busDetail.bus_id?.replace('BUS', '')) % 40)}%
                        </span>
                      </div>
                    </div>
                    <div className="glass p-6 rounded-2xl bg-white border border-slate-100 flex flex-col gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Signal</span>
                      <div className="flex items-center gap-2">
                        <Zap size={20} className="text-success" fill="currentColor" />
                        <span className="text-2xl font-black tracking-tighter text-success">LIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="flex items-center gap-3 opacity-40">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Live data · updates every 3s
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Panel Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button
                onClick={closeDetail}
                className="btn-primary-ghost w-full text-[10px] font-black uppercase tracking-widest py-3"
              >
                Close Panel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FleetManagement;