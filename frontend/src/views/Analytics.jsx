import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  BarChart3, PieChart as PieIcon, Calendar, Download,
  TrendingUp, CloudRain, Leaf, Activity, Brain, Target
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

const Analytics = () => {
  const {
    metrics = {}, fleetDistribution = {}, routeStats = [], zoneStats = [],
    predictionAccuracy = {}
  } = useFleet();

  const modeShareData = [
    { name: 'Bus',    value: 45, color: '#10b981' },
    { name: 'Metro',  value: 30, color: '#3b82f6' },
    { name: 'Auto',   value: 15, color: '#f59e0b' },
    { name: 'Others', value: 10, color: '#94a3b8' },
  ];

  const utilizationData = Object.entries(fleetDistribution.byDepot || {}).map(([id, depot]) => ({
    name: depot.name.replace(' Depot', '').replace(' Bus Stand', ''),
    active: (depot.total || 0) - (depot.idle || 0),
    idle: depot.idle || 0,
    maintenance: 0
  }));

  const ridershipTrend = routeStats.slice(0, 6).map(route => ({
    time: route.name.length > 12 ? route.name.substring(0, 12) : route.name,
    bus: route.total_load,
    metro: Math.round(route.total_load * 0.6)
  }));

  // Phase 5 — Prediction accuracy data
  const overallAccuracy = predictionAccuracy?.overallAccuracy ?? null;
  const target          = predictionAccuracy?.target          ?? 80;
  const accuracyPct     = overallAccuracy !== null ? Math.min(100, Math.max(0, overallAccuracy)) : null;
  const accuracyColor   = accuracyPct === null ? '#94a3b8' : accuracyPct >= 80 ? '#10b981' : accuracyPct >= 60 ? '#f59e0b' : '#ef4444';

  const byZone = predictionAccuracy?.byZone || {};
  const zoneAccuracyList = Object.entries(byZone)
    .map(([id, z]) => ({ id, name: z.zone_name, accuracy: z.accuracy, readings: z.readings || [] }))
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 6);

  return (
    <div className="p-8 h-full overflow-y-auto animate-fade-in flex flex-col gap-8 scrollbar-pro bg-main">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Decarbonization Analytics</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-accent">Fleet Analytics Engine</h1>
          <p className="text-sm text-text-muted font-medium">Multi-modal transport share &amp; sustainable network performance diagnostics.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex gap-4 pr-6 border-r border-slate-200">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Weather Impact</span>
              <div className="flex items-center gap-2">
                <CloudRain size={16} className="text-info" />
                <span className="text-sm font-black text-accent">28°C / High Humidity</span>
              </div>
            </div>
            <div className="p-2 bg-info/10 rounded-lg border border-info/20 self-center">
              <span className="text-[9px] font-black text-info uppercase tracking-tight">+12% Demand Surge</span>
            </div>
          </div>
          <button className="btn-primary-ghost"><Download size={16} /> Export Data</button>
        </div>
      </div>

      {/* Phase 5 — AI Accuracy Card */}
      <div className="glass rounded-3xl bg-white p-8 border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <Brain size={18} className="text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-accent">AI Prediction Accuracy</h3>
          <span className={`text-[9px] font-black px-3 py-1 rounded-full ml-auto ${
            accuracyPct === null  ? 'bg-slate-100 text-slate-400' :
            accuracyPct >= 80    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
            accuracyPct >= 60    ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                   'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {accuracyPct !== null ? `${accuracyPct.toFixed(1)}% ACCURACY` : 'WARMING UP'}
          </span>
        </div>

        {/* Overall Progress Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${accuracyPct || 0}%`, backgroundColor: accuracyColor }}
            />
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-xl font-black text-accent">
              {accuracyPct !== null ? `${accuracyPct.toFixed(1)}%` : '—'}
            </span>
            <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Target: {target}%</span>
          </div>
        </div>

        {/* Target marker line info */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: accuracyColor }} />
          <span className="text-[10px] font-bold text-text-muted">
            {accuracyPct !== null
              ? accuracyPct >= target
                ? `✅ Target achieved! ${(accuracyPct - target).toFixed(1)}% above the ${target}% goal`
                : `⚠ ${(target - accuracyPct).toFixed(1)}% below the ${target}% target — collecting more data`
              : 'Accuracy data accumulates over the first few minutes of operation'}
          </span>
        </div>

        {/* Per-zone sparklines */}
        {zoneAccuracyList.length > 0 && (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {zoneAccuracyList.map(zone => {
              const sparkData = zone.readings.map((r, i) => ({ i, predicted: r.predicted, actual: r.actual }));
              const zColor = zone.accuracy >= 80 ? '#10b981' : zone.accuracy >= 60 ? '#f59e0b' : '#ef4444';
              return (
                <div key={zone.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-accent truncate pr-2">{zone.name}</span>
                    <span className="text-[10px] font-black shrink-0" style={{ color: zColor }}>
                      {zone.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  {sparkData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={50}>
                      <LineChart data={sparkData}>
                        <Line type="monotone" dataKey="actual"    stroke="#94a3b8" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="predicted" stroke={zColor}  strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[50px] flex items-center justify-center">
                      <span className="text-[9px] font-bold text-text-dim uppercase">Collecting…</span>
                    </div>
                  )}
                  <div className="flex gap-3 mt-2">
                    <div className="flex items-center gap-1"><div className="w-2 h-0.5 bg-slate-400 rounded" /><span className="text-[8px] font-bold text-text-dim">Actual</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-0.5 rounded" style={{ backgroundColor: zColor }} /><span className="text-[8px] font-bold text-text-dim">Predicted</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Ridership Trends */}
        <div className="xl:col-span-2 glass p-8 rounded-3xl flex flex-col min-h-[400px] bg-white">
          <div className="flex justify-between items-center mb-10 px-2">
            <h3 className="text-lg font-black tracking-tight text-accent uppercase tracking-widest flex items-center gap-3">
              <Activity size={18} className="text-primary" /> Network Ridership Trend
            </h3>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Bus Network</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-info" /><span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Metro Core</span></div>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ridershipTrend}>
                <defs>
                  <linearGradient id="colorBus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorMetro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="bus"   stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBus)" />
                <Area type="monotone" dataKey="metro" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMetro)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transport Mode Share */}
        <div className="glass p-8 rounded-3xl flex flex-col bg-white">
          <h3 className="text-lg font-black tracking-tight text-accent mb-2 uppercase tracking-widest flex items-center gap-3">
            <PieIcon size={18} className="text-primary" /> Mode Share
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-10">Cross-network distribution</p>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modeShareData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value">
                  {modeShareData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black tracking-tighter text-accent">42%</span>
              <span className="text-[9px] font-black uppercase text-primary">SDG Progress</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {modeShareData.map(mode => (
              <div key={mode.name} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mode.color }} />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-accent">{mode.value}%</span>
                  <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">{mode.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Depot Utilization */}
        <div className="xl:col-span-3 glass p-8 rounded-3xl flex flex-col min-h-[350px] bg-white">
          <div className="flex justify-between items-end mb-10 px-2">
            <div>
              <h3 className="text-lg font-black tracking-tight text-accent uppercase tracking-widest flex items-center gap-3">
                <BarChart3 size={18} className="text-primary" /> Depot Fleet Status
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mt-2">Live availability across critical transit hubs</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary"/><span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Active</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-200"/><span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Idle</span></div>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Bar dataKey="active" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={45} />
                <Bar dataKey="idle"   stackId="a" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
