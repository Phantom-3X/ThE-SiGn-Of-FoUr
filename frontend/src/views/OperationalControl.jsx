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
import { deployBus, acknowledgeAlert, rebalanceBuses, changeFrequency, emergencyDispatch } from '../services/api';

const typeConfig = {
  extend_route:       { label: 'Route Extension',       icon: '🗺️', color: 'border-l-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', btn: 'bg-violet-600 hover:bg-violet-700' },
  add_stop:           { label: 'New Stop Suggested',    icon: '📍', color: 'border-l-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700' },
  express_variant:    { label: 'Express Variant',       icon: '⚡', color: 'border-l-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700',  btn: 'bg-amber-600 hover:bg-amber-700' },
  reroute:            { label: 'Emergency Reroute',     icon: '🔀', color: 'border-l-red-500',    bg: 'bg-red-50',    text: 'text-red-700',    btn: 'bg-red-600 hover:bg-red-700' },
  deploy_bus:         { label: 'Priority Optimization', icon: '🚌', color: 'border-l-primary',   bg: 'bg-white',     text: 'text-primary',    btn: 'bg-primary hover:bg-emerald-600' },
  increase_frequency: { label: 'Frequency Increase',   icon: '⏱️', color: 'border-l-primary',   bg: 'bg-white',     text: 'text-primary',    btn: 'bg-primary hover:bg-emerald-600' },
  decrease_frequency: { label: 'Frequency Decrease',   icon: '⏱️', color: 'border-l-slate-400', bg: 'bg-white',     text: 'text-slate-600',  btn: 'bg-slate-600 hover:bg-slate-700' },
  rebalance_fleet:    { label: 'Fleet Rebalance',      icon: '⚖️', color: 'border-l-primary',   bg: 'bg-white',     text: 'text-primary',    btn: 'bg-primary hover:bg-emerald-600' },
  metro_support:      { label: 'Metro Support',        icon: '🚇', color: 'border-l-blue-500',   bg: 'bg-white',     text: 'text-blue-600',   btn: 'bg-blue-600 hover:bg-blue-700' },
};

const ROUTE_SUGGESTION_TYPES = ['extend_route', 'add_stop', 'express_variant', 'reroute'];

const OperationalControl = () => {
  const { alerts = [], recommendations = [], refresh, buses = [], routes = [] } = useFleet();

  const [dispatchLog, setDispatchLog] = useState([
    { id: 1, type: 'system', message: 'Tactical Intelligence Core Initialized.', time: '10:00:00' },
    { id: 2, type: 'ai', message: 'Goal 11.2 optimization protocol active.', time: '10:05:22' },
  ]);

  const [rebalanceForm, setRebalanceForm] = useState({ fromRouteId: '', toRouteId: '', count: 1 });
  const [frequencyForm, setFrequencyForm] = useState({ routeId: '', frequency: 10 });
  const [emergencyForm, setEmergencyForm] = useState({ routeId: '', count: 2 });
  const [rebalanceMsg, setRebalanceMsg] = useState(null);
  const [frequencyMsg, setFrequencyMsg] = useState(null);
  const [emergencyMsg, setEmergencyMsg] = useState(null);

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
    if (rec.action === 'deploy_bus' && rec.route_id) {
      addLog(`Executing CMD: Deploy unit → ${rec.route_id}`, 'system');
      try {
        addLog(`SUCCESS: Strategic unit deployed to ${rec.route_id}`, 'ai');
        refresh();
      } catch (err) {
        addLog(`ERROR: Deployment failed for ${rec.route_id}`, 'error');
      }
    } else if (ROUTE_SUGGESTION_TYPES.includes(rec.action)) {
      addLog(`AI ROUTE CMD: ${rec.action.replace(/_/g, ' ')} on ${rec.route_id || 'network'}`, 'ai');
      addLog(`Route change logged for operator review: ${rec.reason}`, 'system');
      refresh();
    } else {
      addLog(`CMD: ${rec.action?.replace(/_/g, ' ')} on ${rec.route_id || 'network'}`, 'action');
      refresh();
    }
  };

  const handleRebalance = async () => {
    const { fromRouteId, toRouteId, count } = rebalanceForm;
    if (!fromRouteId || !toRouteId || fromRouteId === toRouteId) {
      setRebalanceMsg({ ok: false, text: 'Select two different routes.' });
      return;
    }
    addLog(`CMD: Rebalance ${count} bus(es) from ${fromRouteId} → ${toRouteId}`, 'system');
    try {
      const res = await rebalanceBuses(fromRouteId, toRouteId, count);
      if (res.data.success) {
        setRebalanceMsg({ ok: true, text: res.data.message });
        addLog(`SUCCESS: ${res.data.message}`, 'ai');
        refresh();
      } else {
        setRebalanceMsg({ ok: false, text: res.data.message });
        addLog(`WARN: ${res.data.message}`, 'system');
      }
    } catch (err) {
      setRebalanceMsg({ ok: false, text: 'Rebalance failed.' });
      addLog(`ERROR: Rebalance failed`, 'error');
    }
  };

  const handleFrequency = async () => {
    const { routeId, frequency } = frequencyForm;
    if (!routeId) {
      setFrequencyMsg({ ok: false, text: 'Select a route.' });
      return;
    }
    addLog(`CMD: Set frequency on ${routeId} → ${frequency} min`, 'system');
    try {
      const res = await changeFrequency(routeId, parseInt(frequency));
      if (res.data.success) {
        setFrequencyMsg({ ok: true, text: res.data.message });
        addLog(`SUCCESS: ${res.data.message}`, 'ai');
        refresh();
      } else {
        setFrequencyMsg({ ok: false, text: res.data.message });
        addLog(`WARN: ${res.data.message}`, 'system');
      }
    } catch (err) {
      setFrequencyMsg({ ok: false, text: 'Frequency change failed.' });
      addLog(`ERROR: Frequency change failed`, 'error');
    }
  };

  const handleEmergencyDispatch = async () => {
    const { routeId, count } = emergencyForm;
    if (!routeId) {
      setEmergencyMsg({ ok: false, text: 'Select a route.' });
      return;
    }
    addLog(`🚨 EMERGENCY DISPATCH: ${count} units → ${routeId}`, 'system');
    try {
      const res = await emergencyDispatch(routeId, parseInt(count));
      if (res.data.success) {
        setEmergencyMsg({ ok: true, text: res.data.message });
        addLog(`SUCCESS: ${res.data.message}`, 'ai');
        refresh();
      } else {
        setEmergencyMsg({ ok: false, text: res.data.message });
        addLog(`WARN: ${res.data.message}`, 'system');
      }
    } catch (err) {
      setEmergencyMsg({ ok: false, text: 'Emergency dispatch failed.' });
      addLog(`ERROR: Emergency dispatch failed for ${routeId}`, 'error');
    }
  };

  const activeAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="p-8 h-full flex flex-col gap-8 animate-fade-in overflow-hidden scrollbar-pro bg-main">

      {/* Header */}
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
            <span className={`text-sm font-black ${
              activeAlerts.filter(a => a.severity === 'critical').length > 0
                ? 'text-danger'
                : activeAlerts.length > 5
                ? 'text-warning'
                : 'text-success'
            }`}>
              {activeAlerts.filter(a => a.severity === 'critical').length > 0
                ? 'CRITICAL / RED'
                : activeAlerts.length > 5
                ? 'DEGRADED / AMBER'
                : 'STABLE / GREEN'
              }
            </span>
          </div>
          <button className="btn-primary-ghost" onClick={refresh}>
            <RefreshCcw size={16} /> Sync Core
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-8 min-h-0">

        {/* Intelligence Stream — Left Column */}
        <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-y-auto pr-2 scrollbar-pro">
          <div className="flex flex-col gap-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2 mb-2">
              <Zap size={14} className="text-primary" fill="currentColor" /> AI Strategy Insights
            </h3>

            {recommendations && recommendations.length > 0 ? (
              recommendations.map((rec, i) => {
                const isRouteSuggestion = ROUTE_SUGGESTION_TYPES.includes(rec.action);
                const cfg = typeConfig[rec.action] || typeConfig.deploy_bus;

                return (
                  <div key={i} className={`glass p-8 rounded-[2rem] border-l-[8px] ${cfg.color} ${cfg.bg} hover:shadow-lg transition-all`}>

                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{cfg.icon}</div>
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.text}`}>
                            {cfg.label}
                          </span>
                          <h4 className="font-black text-base leading-tight text-accent mt-1">
                            {rec.priority?.toUpperCase()} PRIORITY
                          </h4>
                        </div>
                      </div>
                      {isRouteSuggestion && (
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full bg-white ${cfg.text} border border-current shrink-0`}>
                          AI Route Intelligence
                        </span>
                      )}
                    </div>

                    {/* Reason */}
                    <p className="text-sm text-text-muted leading-relaxed mb-6 font-bold opacity-90">
                      {rec.reason}
                    </p>

                    {/* Route + Timestamp */}
                    {rec.route_id && (
                      <div className="flex items-center gap-2 mb-6">
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">Route:</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg bg-white border ${cfg.text}`}>
                          {rec.route_id}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-dim ml-auto">
                          {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => handleExecute(rec)}
                      className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] tracking-widest uppercase font-black text-white shadow-lg transition-all active:scale-95 ${cfg.btn}`}
                    >
                      {isRouteSuggestion ? 'Apply Route Change' : 'Execute Action'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="glass p-20 rounded-[2rem] border-dashed border-slate-200 bg-white opacity-40 h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <p className="font-black uppercase tracking-[0.3em] text-sm text-emerald-600">Equilibrium Detected</p>
                <p className="text-[10px] mt-3 font-bold text-slate-400 max-w-[250px] uppercase">
                  All transport goals are currently meeting sustainability targets.
                </p>
              </div>
            )}
          </div>
        </div>
        {/* End Left Column */}

        {/* Tactical Feed — Right Column */}
        <div className="w-[480px] flex flex-col gap-6 overflow-y-auto scrollbar-pro">

          {/* Active Anomalies */}
          <div className="glass rounded-[2rem] flex flex-col overflow-hidden border-slate-200 bg-white shadow-lg shrink-0" style={{ maxHeight: '280px' }}>
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
                        <span className="text-xs font-black text-accent group-hover:text-danger transition-colors">
                          {alert.message}
                        </span>
                        <span className="text-[9px] text-text-dim font-bold uppercase tracking-widest">
                          Type: {alert.type?.toUpperCase() || 'NETWORK_OVR_01'}
                        </span>
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
          {/* End Active Anomalies */}

          {/* Fleet Operations Panel */}
          <div className="glass rounded-[2rem] flex flex-col overflow-hidden border-slate-200 bg-white shadow-lg shrink-0">
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <Zap size={16} className="text-primary" /> Fleet Operations
              </h3>
            </div>

            <div className="p-6 flex flex-col gap-6">

              {/* Rebalance */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Rebalance Buses</span>
                <div className="flex gap-2">
                  <select
                    value={rebalanceForm.fromRouteId}
                    onChange={e => setRebalanceForm(f => ({ ...f, fromRouteId: e.target.value }))}
                    className="flex-1 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-accent"
                  >
                    <option value="">From route...</option>
                    {routes.map(r => (
                      <option key={r.route_id} value={r.route_id}>{r.route_id} — {r.name}</option>
                    ))}
                  </select>
                  <select
                    value={rebalanceForm.toRouteId}
                    onChange={e => setRebalanceForm(f => ({ ...f, toRouteId: e.target.value }))}
                    className="flex-1 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-accent"
                  >
                    <option value="">To route...</option>
                    {routes.map(r => (
                      <option key={r.route_id} value={r.route_id}>{r.route_id} — {r.name}</option>
                    ))}
                  </select>
                  <select
                    value={rebalanceForm.count}
                    onChange={e => setRebalanceForm(f => ({ ...f, count: parseInt(e.target.value) }))}
                    className="w-16 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-accent"
                  >
                    {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button
                  onClick={handleRebalance}
                  className="btn-primary-ghost w-full text-[10px] font-black uppercase tracking-widest py-2.5"
                >
                  Execute Rebalance
                </button>
                {rebalanceMsg && (
                  <span className={`text-[10px] font-black ${rebalanceMsg.ok ? 'text-success' : 'text-danger'}`}>
                    {rebalanceMsg.text}
                  </span>
                )}
              </div>

              <div className="border-t border-slate-100"></div>

              {/* Change Frequency */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Change Route Frequency</span>
                <div className="flex gap-2">
                  <select
                    value={frequencyForm.routeId}
                    onChange={e => setFrequencyForm(f => ({ ...f, routeId: e.target.value }))}
                    className="flex-1 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-accent"
                  >
                    <option value="">Select route...</option>
                    {routes.map(r => (
                      <option key={r.route_id} value={r.route_id}>{r.route_id} — {r.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3">
                    <input
                      type="number"
                      min={5}
                      max={30}
                      value={frequencyForm.frequency}
                      onChange={e => setFrequencyForm(f => ({ ...f, frequency: e.target.value }))}
                      className="w-12 text-[11px] font-black bg-transparent focus:outline-none text-accent text-center"
                    />
                    <span className="text-[10px] font-black text-text-dim uppercase">min</span>
                  </div>
                </div>
                <button
                  onClick={handleFrequency}
                  className="btn-primary-ghost w-full text-[10px] font-black uppercase tracking-widest py-2.5"
                >
                  Apply Frequency
                </button>
                {frequencyMsg && (
                  <span className={`text-[10px] font-black ${frequencyMsg.ok ? 'text-success' : 'text-danger'}`}>
                    {frequencyMsg.text}
                  </span>
                )}
              </div>

              <div className="border-t border-slate-100"></div>

              {/* Emergency Dispatch */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-danger">⚡ Emergency Dispatch</span>
                <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest leading-relaxed">
                  Rapidly deploy multiple buses from all available depots to a single route.
                </p>
                <div className="flex gap-2">
                  <select
                    value={emergencyForm.routeId}
                    onChange={e => setEmergencyForm(f => ({ ...f, routeId: e.target.value }))}
                    className="flex-1 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-danger text-accent"
                  >
                    <option value="">Select route...</option>
                    {routes.map(r => (
                      <option key={r.route_id} value={r.route_id}>{r.route_id} — {r.name}</option>
                    ))}
                  </select>
                  <select
                    value={emergencyForm.count}
                    onChange={e => setEmergencyForm(f => ({ ...f, count: parseInt(e.target.value) }))}
                    className="w-16 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-danger text-accent"
                  >
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button
                  onClick={handleEmergencyDispatch}
                  className="w-full py-3 rounded-2xl flex items-center justify-center gap-3 text-[10px] tracking-widest uppercase font-black bg-danger text-white shadow-lg shadow-danger/20 hover:bg-red-600 active:scale-95 transition-all"
                >
                  🚨 Emergency Dispatch
                </button>
                {emergencyMsg && (
                  <span className={`text-[10px] font-black ${emergencyMsg.ok ? 'text-success' : 'text-danger'}`}>
                    {emergencyMsg.text}
                  </span>
                )}
              </div>

            </div>
          </div>
          {/* End Fleet Operations Panel */}

          {/* Tactical Instruction Log */}
          <div className="glass rounded-[2rem] flex flex-col overflow-hidden border-slate-200 bg-white shadow-lg" style={{ minHeight: '300px' }}>
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <Terminal size={16} className="text-primary" /> Command Instruction Log
              </h3>
              <Activity size={14} className="text-primary/40 animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto p-8 font-mono text-[11px] space-y-4 scrollbar-pro bg-slate-50/50">
              {dispatchLog.map((log) => (
                <div key={log.id} className="flex gap-5 group">
                  <span className="text-text-dim opacity-40 font-bold whitespace-nowrap group-hover:opacity-100 transition-opacity">
                    [{log.time}]
                  </span>
                  <span className={
                    log.type === 'system' ? 'text-primary font-black' :
                    log.type === 'error'  ? 'text-danger font-black' :
                    log.type === 'ai'     ? 'text-emerald-600 font-bold' :
                    'text-accent'
                  }>
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
          {/* End Tactical Instruction Log */}

        </div>
        {/* End Right Column */}

      </div>
      {/* End Main Content */}

    </div>
  );
};

export default OperationalControl;