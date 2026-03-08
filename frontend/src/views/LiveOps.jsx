import React from 'react';
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
  Layers
} from 'lucide-react';

const LiveOps = () => {
  const { metrics = {}, buses = [], routes = [], depots = [], demandZones = [], alerts = [], refresh } = useFleet();

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
            label="Fleet Sync" 
            value={metrics.fleet_utilization || '0'} 
            unit="%"
            icon={Activity}
            colorClass="bg-success/10 text-success"
          />
          <KPICard 
            label="Energy Eff." 
            value={metrics.system_efficiency || '0'} 
            unit="idx"
            icon={Zap}
            colorClass="bg-info/10 text-info"
          />
        </div>
        
        <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">Transmission</span>
            <span className="text-xs font-black text-success">ENCRYPTED</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
             <Layers size={20} />
          </div>
        </div>
      </div>

      {/* Main Map Interface */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative">
          <LiveMap 
            buses={buses} 
            routes={routes} 
            depots={depots} 
            demandZones={demandZones} 
          />
          
          {/* Map Overlay Controls */}
          <div className="absolute top-8 left-8 z-[400] flex flex-col gap-3">
             <div className="glass p-4 rounded-2xl flex items-center gap-4 bg-white/90 backdrop-blur-md border-slate-200">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Real-time Telemetry Active</span>
             </div>
          </div>
        </div>
        
        {/* Alerts Sidebar */}
        <div className="w-[380px] border-l border-slate-100 bg-white">
          <AlertsSidebar alerts={alerts} onAcknowledge={handleAcknowledge} />
        </div>
      </div>
    </div>
  );
};

export default LiveOps;
