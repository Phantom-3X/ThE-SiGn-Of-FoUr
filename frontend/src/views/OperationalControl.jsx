import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import api from '../services/api';
import {
  Zap, Send, ShieldAlert, ArrowRight, RefreshCcw, CheckCircle2,
  Terminal, Activity, Leaf, ToggleLeft, ToggleRight, Target
} from 'lucide-react';
import { deployBus, acknowledgeAlert, rebalanceBuses, changeFrequency, emergencyDispatch } from '../services/api';

const typeConfig = {
  extend_route:       { label: 'Route Extension',       icon: '🗺️', color: 'border-l-violet-500', bg: 'bg-violet-50',  text: 'text-violet-700', btn: 'bg-violet-600 hover:bg-violet-700' },
  add_stop:           { label: 'New Stop Suggested',    icon: '📍', color: 'border-l-blue-500',   bg: 'bg-blue-50',    text: 'text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700' },
  express_variant:    { label: 'Express Variant',       icon: '⚡', color: 'border-l-amber-500',  bg: 'bg-amber-50',   text: 'text-amber-700',  btn: 'bg-amber-600 hover:bg-amber-700' },
  reroute:            { label: 'Emergency Reroute',     icon: '🔀', color: 'border-l-red-500',    bg: 'bg-red-50',     text: 'text-red-700',    btn: 'bg-red-600 hover:bg-red-700' },
  deploy_bus:         { label: 'Priority Optimization', icon: '🚌', color: 'border-l-primary',    bg: 'bg-white',      text: 'text-primary',    btn: 'bg-primary hover:bg-emerald-600' },
  increase_frequency: { label: 'Frequency Increase',   icon: '⏱️', color: 'border-l-primary',    bg: 'bg-white',      text: 'text-primary',    btn: 'bg-primary hover:bg-emerald-600' },
  decrease_frequency: { label: 'Frequency Decrease',   icon: '⏱️', color: 'border-l-slate-400',  bg: 'bg-white',      text: 'text-slate-600',  btn: 'bg-slate-600 hover:bg-slate-700' },
  rebalance_fleet:    { label: 'Fleet Rebalance',      icon: '⚖️', color: 'border-l-primary',    bg: 'bg-white',      text: 'text-primary',    btn: 'bg-primary hover:bg-emerald-600' },
  metro_support:      { label: 'Metro Support',        icon: '🚇', color: 'border-l-blue-500',   bg: 'bg-white',      text: 'text-blue-600',   btn: 'bg-blue-600 hover:bg-blue-700' },
};

const ROUTE_SUGGESTION_TYPES = ['extend_route', 'add_stop', 'express_variant', 'reroute'];

const bindingColors = {
  waitTime: 'text-red-600 bg-red-50 border-red-200',
  fuel:     'text-amber-600 bg-amber-50 border-amber-200',
  emptyKm:  'text-orange-600 bg-orange-50 border-orange-200',
};

const OperationalControl = () => {
  const {
    alerts = [], recommendations = [], refresh, buses = [], routes = [],
    autoDispatchEnabled = true, autoDispatchLog = [],
    optimisationScores = { waitScore: 0, fuelScore: 0, emptyKmScore: 0, bindingConstraint: 'waitTime' }, events = [],
    activeSurge = null, surgeReports = []
  } = useFleet();

  const [rebalancingLog, setRebalancingLog] = useState([]);
  const [rebalancingConfig, setRebalancingConfig] = useState({
    autoDispatchEnabled: true,
    urgencyThreshold: 0.6,
    maxDispatchPerMinute: 3,
    loadWeight: 0.6,
    velocityWeight: 0.4
  });

  const [dispatchLog, setDispatchLog] = useState([
    { id: 1, type: 'system', message: 'Tactical Intelligence Core Initialized.', time: '10:00:00' },
    { id: 2, type: 'ai',     message: 'Goal 11.2 optimization protocol active.',  time: '10:05:22' },
  ]);

  const [rebalanceForm,  setRebalanceForm]  = useState({ fromRouteId: '', toRouteId: '', count: 1 });
  const [frequencyForm,  setFrequencyForm]  = useState({ routeId: '', frequency: 10 });
  const [emergencyForm,  setEmergencyForm]  = useState({ routeId: '', count: 2 });
  const [rebalanceMsg,   setRebalanceMsg]   = useState(null);
  const [frequencyMsg,   setFrequencyMsg]   = useState(null);
  const [emergencyMsg,   setEmergencyMsg]   = useState(null);

  // Phase 1 — polling rebalancing log and config
  useEffect(() => {
    const fetchRebalancingData = async () => {
      try {
        const logRes = await api.get('/rebalancing-log');
        setRebalancingLog(logRes.data.slice(0, 10));
      } catch (err) {}
    };

    const fetchConfig = async () => {
      try {
        const configRes = await api.get('/rebalancing-config');
        setRebalancingConfig(configRes.data);
      } catch (err) {}
    };

    fetchRebalancingData();
    fetchConfig();
    const timer = setInterval(fetchRebalancingData, 5000);
    return () => clearInterval(timer);
  }, []);

  const addLog = (message, type = 'action') => {
    setDispatchLog(prev => [{ id: Date.now(), message, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
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
      const res = await api.post('/rebalance', { fromRouteId, toRouteId, count });
      if (res.data.success) {
        setRebalanceMsg({ ok: true, text: res.data.message });
        addLog(`SUCCESS: ${res.data.message}`, 'ai');
        refresh();
      } else {
        setRebalanceMsg({ ok: false, text: res.data.message });
      }
    } catch (err) {
      setRebalanceMsg({ ok: false, text: 'Rebalance failed.' });
      addLog(`ERROR: Rebalance failed`, 'error');
    }
  };

  const handleFrequency = async () => {
    const { routeId, frequency } = frequencyForm;
    if (!routeId) { setFrequencyMsg({ ok: false, text: 'Select a route.' }); return; }
    addLog(`CMD: Set frequency on ${routeId} → ${frequency} min`, 'system');
    try {
      const res = await api.post('/change-frequency', { routeId, frequency: parseInt(frequency) });
      if (res.data.success) {
        setFrequencyMsg({ ok: true, text: res.data.message });
        addLog(`SUCCESS: ${res.data.message}`, 'ai');
        refresh();
      } else {
        setFrequencyMsg({ ok: false, text: res.data.message });
      }
    } catch (err) {
      setFrequencyMsg({ ok: false, text: 'Frequency change failed.' });
    }
  };

  const handleEmergencyDispatch = async () => {
    const { routeId, count } = emergencyForm;
    if (!routeId) { setEmergencyMsg({ ok: false, text: 'Select a route.' }); return; }
    addLog(`🚨 EMERGENCY DISPATCH: ${count} units → ${routeId}`, 'system');
    try {
      const res = await api.post('/emergency-dispatch', { routeId, count: parseInt(count) });
      if (res.data.success) {
        setEmergencyMsg({ ok: true, text: res.data.message });
        addLog(`SUCCESS: ${res.data.message}`, 'ai');
        refresh();
      } else {
        setEmergencyMsg({ ok: false, text: res.data.message });
      }
    } catch (err) {
      setEmergencyMsg({ ok: false, text: 'Emergency dispatch failed.' });
    }
  };

  // Phase 1 — Rebalancing Config Update
  const updateRebalancingConfig = async (updates) => {
    const newConfig = { ...rebalancingConfig, ...updates };
    setRebalancingConfig(newConfig); // optimistic update
    try {
      await api.post('/rebalancing-config', newConfig);
      addLog(`Rebalancing settings updated`, 'system');
      refresh();
    } catch (err) {
      addLog('ERROR: Could not update rebalancing config', 'error');
    }
  };

  const handleToggleAutoDispatch = () => {
    updateRebalancingConfig({ autoDispatchEnabled: !rebalancingConfig.autoDispatchEnabled });
  };



  // Phase 7 — trigger surge
  const handleTriggerSurge = async (event) => {
    if (!event?.zone_id) return;
    try {
      const res = await api.post('/trigger-surge', { zone_id: event.zone_id });
      addLog(`🚨 SURGE TRIGGERED: ${event.name} zone burst — ${res.data.message}`, 'error');
      refresh();
    } catch (err) {
      addLog('ERROR: Surge trigger failed', 'error');
    }
  };

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const concertEvents = events.filter(e => e.type === 'concert');

  const binding   = optimisationScores.bindingConstraint || 'waitTime';
  const bLabel    = { waitTime: 'Wait Time', fuel: 'Fuel Use', emptyKm: 'Empty KM' }[binding] || binding;
  const getPillColor = (score) => {
    if (score < 0.3) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score <= 0.6) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

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
          <p className="text-sm text-text-muted font-medium">Sustainable fleet orchestration &amp; operator override console.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end pr-4 border-r border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Network State</span>
            <span className={`text-sm font-black ${
              activeAlerts.filter(a => a.severity === 'critical').length > 0 ? 'text-danger' :
              activeAlerts.length > 5 ? 'text-warning' : 'text-success'
            }`}>
              {activeAlerts.filter(a => a.severity === 'critical').length > 0 ? 'CRITICAL / RED' :
               activeAlerts.length > 5 ? 'DEGRADED / AMBER' : 'STABLE / GREEN'}
            </span>
          </div>
          <button className="btn-primary-ghost" onClick={refresh}>
            <RefreshCcw size={16} /> Sync Core
          </button>
        </div>
      </div>

      {/* Phase 7 — Victory Banner */}
      {activeSurge && (
        <div className={`rounded-2xl px-6 py-4 border-2 flex items-center justify-between ${
          activeSurge.surge_resolved ? 'bg-emerald-50 border-emerald-400' : 'bg-red-50 border-red-400'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeSurge.surge_resolved ? '🏆' : '🚨'}</span>
            <div>
              <p className={`text-sm font-black uppercase tracking-widest ${activeSurge.surge_resolved ? 'text-emerald-700' : 'text-red-700'}`}>
                {activeSurge.surge_resolved ? 'VICTORY — Surge Resolved!' : `ACTIVE SURGE — ${activeSurge.zone_name}`}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Peak: {activeSurge.peak_demand} pax | Buses deployed: {activeSurge.buses_deployed}
              </p>
            </div>
          </div>
          {/* Countdown bar */}
          {!activeSurge.surge_resolved && (
            <div className="flex items-center gap-3">
              <div className="w-40 h-2 bg-red-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
              <span className="text-[10px] font-black text-red-600 uppercase">LIVE</span>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex gap-8 min-h-0">

        {/* Left Column — AI insights + Phase 2 optimisation */}
        <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-y-auto pr-2 scrollbar-pro">

          {/* Phase 2 — Compact Optimisation Status */}
          <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 shadow rounded-2xl">
            <Target size={14} className="text-primary shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-accent shrink-0 border-r border-slate-100 pr-3">Optimisation</span>
            
            <div className="flex items-center gap-2 flex-1">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getPillColor(optimisationScores.waitScore)}`}>
                Wait: {optimisationScores.waitScore?.toFixed(2)}
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getPillColor(optimisationScores.fuelScore)}`}>
                Fuel: {optimisationScores.fuelScore?.toFixed(2)}
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getPillColor(optimisationScores.emptyKmScore)}`}>
                Empty km: {optimisationScores.emptyKmScore?.toFixed(2)}
              </span>
            </div>
            
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${bindingColors[binding]}`}>
              ▲ Binding: {bLabel}
            </span>
          </div>

          {/* AI Strategy Insights */}
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
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{cfg.icon}</div>
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.text}`}>{cfg.label}</span>
                          <h4 className="font-black text-base leading-tight text-accent mt-1">{rec.priority?.toUpperCase()} PRIORITY</h4>
                        </div>
                      </div>
                      {isRouteSuggestion && (
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full bg-white ${cfg.text} border border-current shrink-0`}>
                          AI Route Intelligence
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed mb-6 font-bold opacity-90">{rec.reason}</p>
                    {rec.route_id && (
                      <div className="flex items-center gap-2 mb-6">
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">Route:</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg bg-white border ${cfg.text}`}>{rec.route_id}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-dim ml-auto">
                          {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    <button onClick={() => handleExecute(rec)}
                      className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] tracking-widest uppercase font-black text-white shadow-lg transition-all active:scale-95 ${cfg.btn}`}>
                      {isRouteSuggestion ? 'Apply Route Change' : 'Execute Action'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="glass p-20 rounded-[2rem] border-dashed border-slate-200 bg-white opacity-40 h-[300px] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <p className="font-black uppercase tracking-[0.3em] text-sm text-emerald-600">Equilibrium Detected</p>
                <p className="text-[10px] mt-3 font-bold text-slate-400 max-w-[250px] uppercase">
                  All transport goals are meeting sustainability targets.
                </p>
              </div>
            )}
          </div>

          {/* Phase 1 — Rebalancing Settings Panel */}
          <div className="glass bg-white rounded-[2rem] p-6 border border-slate-100 shadow mt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-accent">Rebalancing Settings</h3>
              </div>
              <button onClick={handleToggleAutoDispatch} className="flex items-center gap-2">
                {rebalancingConfig.autoDispatchEnabled
                  ? <ToggleRight size={22} className="text-primary" />
                  : <ToggleLeft  size={22} className="text-slate-300" />}
                <span className={`text-[10px] font-black uppercase tracking-widest ${rebalancingConfig.autoDispatchEnabled ? 'text-primary' : 'text-slate-400'}`}>
                  {rebalancingConfig.autoDispatchEnabled ? 'AUTO ON' : 'AUTO OFF'}
                </span>
              </button>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">Urgency Threshold</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-accent">{rebalancingConfig.urgencyThreshold.toFixed(2)}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                      rebalancingConfig.urgencyThreshold < 0.6 ? 'bg-red-100 text-red-700' :
                      rebalancingConfig.urgencyThreshold > 0.8 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {rebalancingConfig.urgencyThreshold < 0.6 ? 'Aggressive' : rebalancingConfig.urgencyThreshold > 0.8 ? 'Conservative' : 'Balanced'}
                    </span>
                  </div>
                </div>
                <input
                  type="range" min="0.1" max="1.0" step="0.05" value={rebalancingConfig.urgencyThreshold}
                  onChange={e => updateRebalancingConfig({ urgencyThreshold: parseFloat(e.target.value) })}
                  className="w-full h-1.5 rounded-full cursor-pointer accent-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">Load Wt</span>
                    <span className="text-[10px] font-black text-accent">{Math.round(rebalancingConfig.loadWeight * 100)}%</span>
                  </div>
                  <input
                    type="range" min="0.1" max="0.9" step="0.1" value={rebalancingConfig.loadWeight}
                    onChange={e => {
                      const lV = parseFloat(e.target.value);
                      updateRebalancingConfig({ loadWeight: lV, velocityWeight: Math.round((1 - lV) * 10) / 10 });
                    }}
                    className="w-full h-1.5 rounded-full cursor-pointer accent-amber-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">Vel Wt</span>
                    <span className="text-[10px] font-black text-slate-400">{Math.round(rebalancingConfig.velocityWeight * 100)}%</span>
                  </div>
                  <input
                    type="range" min="0.1" max="0.9" step="0.1" value={rebalancingConfig.velocityWeight} disabled
                    className="w-full h-1.5 rounded-full cursor-not-allowed accent-slate-300 opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">Max Dispatches / Min</span>
                <input
                  type="number" min="1" max="10" value={rebalancingConfig.maxDispatchPerMinute}
                  onChange={e => updateRebalancingConfig({ maxDispatchPerMinute: parseInt(e.target.value) })}
                  className="w-16 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-primary text-accent text-center"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column — Tactical Feed */}
        <div className="w-[480px] flex flex-col gap-6 overflow-y-auto scrollbar-pro">

          {/* Phase 1 — Live Rebalancing Feed */}
          <div className="glass rounded-2xl bg-white border border-slate-100 shadow overflow-hidden shrink-0">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <Zap size={14} className="text-primary" fill="currentColor" /> Live Rebalancing Feed
              </h3>
            </div>
            <div className="max-h-60 overflow-y-auto p-4 space-y-3 scrollbar-pro">
              {rebalancingLog.slice(0, 10).length > 0 ? rebalancingLog.slice(0, 10).map((log, i) => {
                const uScore = parseFloat(log.urgencyScore);
                const isCrit = uScore >= 0.90;
                const isHigh = uScore >= 0.75;
                const dVel = parseFloat(log.demandVelocity);
                return (
                  <div key={i} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase ${
                          log.trigger === 'auto' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {log.trigger}
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase ${
                          isCrit ? 'bg-red-100 text-red-700 border border-red-200' :
                          isHigh ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                                   'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {isCrit ? 'Critical' : isHigh ? 'High' : 'Moderate'}
                        </span>
                        <span className="text-[8px] font-black uppercase text-text-dim tracking-widest">{log.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-black ${dVel > 0 ? 'text-emerald-500' : dVel < 0 ? 'text-slate-400' : 'text-slate-400'}`}>
                          {dVel > 0 ? '▲' : dVel < 0 ? '▼' : ''} {dVel > 0 ? '+' : ''}{log.demandVelocity}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🚌</span>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-accent truncate">{routes.find(r => r.route_id === log.route_id)?.name || log.route_id}</span>
                          <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">{log.busesDeployed} deployed · Load: {Math.round(log.loadFactor * 100)}%</span>
                        </div>
                      </div>
                      <span className="text-[12px] font-black text-accent">{log.urgencyScore}</span>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-[10px] font-black text-text-dim text-center py-6 uppercase tracking-widest">No auto-dispatches yet<br/><span className="text-[9px] normal-case tracking-normal">System monitoring demand</span></p>
              )}
            </div>
          </div>

          {/* Active Anomalies */}
          <div className="glass rounded-[2rem] flex flex-col overflow-hidden border-slate-200 bg-white shadow-lg shrink-0" style={{ maxHeight: '240px' }}>
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-danger flex items-center gap-2">
                <ShieldAlert size={16} /> Critical Anomalies
              </h3>
              <span className="bg-danger text-white text-[9px] px-3 py-1 rounded-full font-black">{activeAlerts.length} UNITS</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-pro">
              {activeAlerts.length > 0 ? activeAlerts.map(alert => (
                <div key={alert.id} className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-danger/30 transition-all group shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1 pr-4">
                      <span className="text-xs font-black text-accent group-hover:text-danger transition-colors">{alert.message}</span>
                      <span className="text-[9px] text-text-dim font-bold uppercase tracking-widest">
                        {alert.type?.toUpperCase()} · {alert.severity?.toUpperCase()}
                      </span>
                    </div>
                    <button onClick={() => acknowledgeAlert(alert.id).then(refresh)}
                      className="text-[10px] font-black text-primary hover:text-accent uppercase tracking-widest underline underline-offset-4 decoration-primary/40">
                      CLR
                    </button>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center">
                  <ShieldAlert size={40} className="text-slate-400" />
                  <p className="text-[11px] font-black mt-4 uppercase tracking-[0.2em]">Zero Feed Alerts</p>
                </div>
              )}
            </div>
          </div>

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
                  <select value={rebalanceForm.fromRouteId}
                    onChange={e => setRebalanceForm(f => ({ ...f, fromRouteId: e.target.value }))}
                    className="flex-1 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-accent">
                    <option value="">From route...</option>
                    {routes.map(r => <option key={r.route_id} value={r.route_id}>{r.route_id} — {r.name}</option>)}
                  </select>
                  <select value={rebalanceForm.toRouteId}
                    onChange={e => setRebalanceForm(f => ({ ...f, toRouteId: e.target.value }))}
                    className="flex-1 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-accent">
                    <option value="">To route...</option>
                    {routes.map(r => <option key={r.route_id} value={r.route_id}>{r.route_id} — {r.name}</option>)}
                  </select>
                  <select value={rebalanceForm.count}
                    onChange={e => setRebalanceForm(f => ({ ...f, count: parseInt(e.target.value) }))}
                    className="w-14 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-primary text-accent">
                    {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button onClick={handleRebalance} className="btn-primary-ghost w-full text-[10px] font-black uppercase tracking-widest py-2.5">
                  Execute Rebalance
                </button>
                {rebalanceMsg && <span className={`text-[10px] font-black ${rebalanceMsg.ok ? 'text-success' : 'text-danger'}`}>{rebalanceMsg.text}</span>}
              </div>

              <div className="border-t border-slate-100" />

              {/* Change Frequency */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Change Route Frequency</span>
                <div className="flex gap-2">
                  <select value={frequencyForm.routeId}
                    onChange={e => setFrequencyForm(f => ({ ...f, routeId: e.target.value }))}
                    className="flex-1 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-accent">
                    <option value="">Select route...</option>
                    {routes.map(r => <option key={r.route_id} value={r.route_id}>{r.route_id} — {r.name}</option>)}
                  </select>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3">
                    <input type="number" min={5} max={30} value={frequencyForm.frequency}
                      onChange={e => setFrequencyForm(f => ({ ...f, frequency: e.target.value }))}
                      className="w-10 text-[11px] font-black bg-transparent focus:outline-none text-accent text-center" />
                    <span className="text-[10px] font-black text-text-dim uppercase">min</span>
                  </div>
                </div>
                <button onClick={handleFrequency} className="btn-primary-ghost w-full text-[10px] font-black uppercase tracking-widest py-2.5">
                  Apply Frequency
                </button>
                {frequencyMsg && <span className={`text-[10px] font-black ${frequencyMsg.ok ? 'text-success' : 'text-danger'}`}>{frequencyMsg.text}</span>}
              </div>

              <div className="border-t border-slate-100" />

              {/* Emergency Dispatch */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-danger">⚡ Emergency Dispatch</span>
                <div className="flex gap-2">
                  <select value={emergencyForm.routeId}
                    onChange={e => setEmergencyForm(f => ({ ...f, routeId: e.target.value }))}
                    className="flex-1 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-danger text-accent">
                    <option value="">Select route...</option>
                    {routes.map(r => <option key={r.route_id} value={r.route_id}>{r.route_id} — {r.name}</option>)}
                  </select>
                  <select value={emergencyForm.count}
                    onChange={e => setEmergencyForm(f => ({ ...f, count: parseInt(e.target.value) }))}
                    className="w-14 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-danger text-accent">
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button onClick={handleEmergencyDispatch}
                  className="w-full py-3 rounded-2xl flex items-center justify-center gap-3 text-[10px] tracking-widest uppercase font-black bg-danger text-white shadow-lg shadow-danger/20 hover:bg-red-600 active:scale-95 transition-all">
                  🚨 Emergency Dispatch
                </button>
                {emergencyMsg && <span className={`text-[10px] font-black ${emergencyMsg.ok ? 'text-success' : 'text-danger'}`}>{emergencyMsg.text}</span>}
              </div>

              {/* Phase 7 — Trigger Surge */}
              {concertEvents.length > 0 && !activeSurge && (
                <>
                  <div className="border-t border-slate-100" />
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">🎵 Concert Surge Trigger</span>
                    {concertEvents.map(ev => (
                      <button key={ev.event_id} onClick={() => handleTriggerSurge(ev)}
                        className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] tracking-widest uppercase font-black bg-purple-600 text-white hover:bg-purple-700 active:scale-95 transition-all">
                        Trigger End-of-Concert Surge: {ev.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Command Instruction Log */}
          <div className="glass rounded-[2rem] flex flex-col overflow-hidden border-slate-200 bg-white shadow-lg" style={{ minHeight: '260px' }}>
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <Terminal size={16} className="text-primary" /> Command Instruction Log
              </h3>
              <Activity size={14} className="text-primary/40 animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto p-8 font-mono text-[11px] space-y-4 scrollbar-pro bg-slate-50/50">
              {dispatchLog.map(log => (
                <div key={log.id} className="flex gap-5 group">
                  <span className="text-text-dim opacity-40 font-bold whitespace-nowrap group-hover:opacity-100 transition-opacity">[{log.time}]</span>
                  <span className={
                    log.type === 'system' ? 'text-primary font-black' :
                    log.type === 'error'  ? 'text-danger font-black' :
                    log.type === 'ai'     ? 'text-emerald-600 font-bold' : 'text-accent'
                  }>
                    <span className="mr-3 opacity-30">&gt;</span>{log.message}
                  </span>
                </div>
              ))}
              <div className="flex gap-2 animate-pulse text-primary pt-2"><span className="font-black">_</span></div>
            </div>
            <div className="p-5 bg-white border-t border-slate-100 flex gap-4 items-center">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs shadow-inner">#</div>
              <input type="text" placeholder="Queue tactical instruction..."
                className="bg-transparent border-none text-xs flex-1 focus:outline-none placeholder:text-slate-300 font-black text-accent"
                onKeyDown={e => { if (e.key === 'Enter' && e.target.value) { addLog(e.target.value, 'action'); e.target.value = ''; } }} />
              <Send size={18} className="text-primary opacity-30 hover:opacity-100 cursor-pointer transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalControl;