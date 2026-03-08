import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { 
  Zap, 
  Send, 
  ShieldAlert, 
  ArrowRight,
  RefreshCcw,
  CheckCircle2,
  Terminal,
  Activity,
  Leaf
} from 'lucide-react';
import { deployBus, acknowledgeAlert } from '../services/api';

const OperationalControl = () => {
  const { alerts = [], recommendations = [], refresh, buses = [] } = useFleet();
  const [dispatchLog, setDispatchLog] = useState([
    { id: 1, type: 'system', message: 'Tactical Intelligence Core Initialized.', time: '10:00:00' },
    { id: 2, type: 'ai', message: 'Goal 11.2 optimization protocol active.', time: '10:05:22' },
  ]);

  const addLog = (message, type = 'action') => {
    const newLog = {
      id: Date.now(),
      message,
      type,
      time: new Date().toLocaleTimeString(),
    };
    setDispatchLog(prev => [newLog, ...prev].slice(0, 15));
  };

  const handleExecute = async (rec) => {
    if (rec.action_params) {
      const { depotId, routeId } = rec.action_params;
      addLog(`Executing CMD: Deploy ${depotId} → ${routeId}`, 'system');
      try {
        await deployBus(depotId, routeId);
        addLog(`SUCCESS: Strategic unit deployed to ${routeId}`, 'ai');
        refresh();
      } catch (err) {
        addLog(`ERROR: Deployment failed at ${depotId}`, 'error');
      }
    }
  };

  const activeAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="p-8 h-full flex flex-col gap-8 animate-fade-in overflow-hidden scrollbar-pro bg-main">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Strategic Mission Control</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-accent">Tactical Command Center</h1>
          <p className="text-sm text-text-muted font-medium">Sustainable fleet orchestration & operator override console.</p>
        </div>
        <div className="flex gap-4">
           <div className="flex flex-col items-end pr-4 border-r border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Network State</span>
              <span className="text-sm font-black text-success">STABLE / GREEN</span>
           </div>
          <button className="btn-primary-ghost" onClick={refresh}>
            <RefreshCcw size={16} /> Sync Core
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Intelligence Stream */}
        <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-y-auto pr-2 scrollbar-pro">
          <div className="flex flex-col gap-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2 mb-2">
              <Zap size={14} className="text-primary" fill="currentColor" /> AI Strategy Insights
            </h3>
            
            {recommendations && recommendations.length > 0 ? (
              recommendations.map((rec, i) => (
                <div key={i} className="glass p-10 rounded-[2rem] border-l-[8px] border-l-primary bg-white hover:border-l-emerald-600 transition-all">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                      <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/10 shadow-sm">
                        <Zap size={28} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Priority Optimization</span>
                        <h4 className="font-black text-xl leading-tight text-accent mt-1">{rec.insight}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed mb-10 font-bold opacity-80">
                    The intelligence core suggests an immediate tactical deployment. Recommendation: <span className="text-accent underline decoration-primary decoration-2">{rec.action}</span>.
                  </p>
                  <button 
                    onClick={() => handleExecute(rec)}
                    className="btn-primary w-full py-5 rounded-2xl flex items-center justify-center gap-4 text-xs tracking-widest uppercase font-black shadow-lg shadow-primary/20"
                  >
                    DEPLOY SUSTAINABLE UNIT
                    <ArrowRight size={20} />
                  </button>
                </div>
              ))
            ) : (
              <div className="glass p-20 rounded-[2rem] border-dashed border-slate-200 bg-white opacity-40 h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <p className="font-black uppercase tracking-[0.3em] text-sm text-emerald-600">Equilibrium Detected</p>
                <p className="text-[10px] mt-3 font-bold text-slate-400 max-w-[250px] uppercase">All transport goals are currently meeting sustainability targets.</p>
              </div>
            )}
          </div>
        </div>

        {/* Tactical Feed & Alerts */}
        <div className="w-[480px] flex flex-col gap-8">
          {/* Active Anomalies Monitoring */}
          <div className="glass rounded-[2rem] flex flex-col h-[40%] overflow-hidden border-slate-200 bg-white shadow-lg">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-danger flex items-center gap-2">
                <ShieldAlert size={16} /> Critical Anomalies
              </h3>
              <span className="bg-danger text-white text-[9px] px-3 py-1 rounded-full font-black">
                {activeAlerts.length} UNITS
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-pro">
              {activeAlerts.length > 0 ? (
                activeAlerts.map((alert) => (
                  <div key={alert.id} className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-danger/30 transition-all group shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1.5 pr-6">
                        <span className="text-xs font-black text-accent group-hover:text-danger transition-colors">{alert.message}</span>
                        <span className="text-[9px] text-text-dim font-bold uppercase tracking-widest">Type: NETWORK_OVR_01</span>
                      </div>
                      <button 
                        onClick={() => acknowledgeAlert(alert.id).then(refresh)}
                        className="text-[10px] font-black text-primary hover:text-accent uppercase tracking-widest underline underline-offset-4 decoration-primary/40"
                      >
                        CLR
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center">
                  <ShieldAlert size={56} className="text-slate-400" />
                  <p className="text-[11px] font-black mt-5 uppercase tracking-[0.2em]">Zero Feed Alerts</p>
                </div>
              )}
            </div>
          </div>

          {/* Tactical Instruction Log */}
          <div className="glass rounded-[2rem] flex-1 flex flex-col overflow-hidden border-slate-200 bg-white shadow-lg">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <Terminal size={16} className="text-primary" /> Command Instruction Log
              </h3>
              <Activity size={14} className="text-primary/40 animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto p-8 font-mono text-[11px] space-y-4 scrollbar-pro bg-slate-50/50">
              {dispatchLog.map((log) => (
                <div key={log.id} className="flex gap-5 group">
                  <span className="text-text-dim opacity-40 font-bold whitespace-nowrap group-hover:opacity-100 transition-opacity">[{log.time}]</span>
                  <span className={log.type === 'system' ? 'text-primary font-black' : log.type === 'error' ? 'text-danger font-black' : log.type === 'ai' ? 'text-emerald-600 font-bold' : 'text-accent'}>
                    <span className="mr-3 opacity-30">&gt;</span>{log.message}
                  </span>
                </div>
              ))}
              <div className="flex gap-2 animate-pulse text-primary pt-2">
                <span className="font-black">_</span>
              </div>
            </div>
            <div className="p-5 bg-white border-t border-slate-100 flex gap-4 items-center">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs shadow-inner">#</div>
              <input 
                type="text" 
                placeholder="Queue tactical instruction..." 
                className="bg-transparent border-none text-xs flex-1 focus:outline-none placeholder:text-slate-300 font-black text-accent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    addLog(e.target.value, 'action');
                    e.target.value = '';
                  }
                }}
              />
              <Send size={18} className="text-primary opacity-30 hover:opacity-100 cursor-pointer transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalControl;
