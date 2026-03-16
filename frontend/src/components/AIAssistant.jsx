import React, { useState } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Search,
  Leaf
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

// ─── Response Engine ───────────────────────────────────────────────────────
// Reads live fleet data and returns a context-aware reply based on keywords.

function generateResponse(input, fleetData) {
  const msg = input.toLowerCase();
  const { metrics = {}, alerts = [], buses = [], recommendations = [], zoneStats = [], metro = {} } = fleetData;

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const crowdedBuses = buses.filter(b => b.status === 'crowded');
  const underusedBuses = buses.filter(b => b.status === 'underutilized');

  // ── Overcrowding / crowded buses
  if (msg.includes('crowd') || msg.includes('overcrowd') || msg.includes('full')) {
    if (crowdedBuses.length === 0) {
      return `No buses are currently overcrowded. Fleet is operating within normal capacity limits. Fleet utilization is at ${metrics.fleet_utilization ?? '—'}%.`;
    }
    const list = crowdedBuses.slice(0, 3).map(b =>
      `${b.bus_id} on ${b.route_id} (${Math.round((b.current_load / b.capacity) * 100)}% load)`
    ).join(', ');
    return `${crowdedBuses.length} buses are currently overcrowded: ${list}. Consider deploying additional units from available depots via the Tactical Command Center.`;
  }

  // ── Alerts / anomalies
  if (msg.includes('alert') || msg.includes('anomal') || msg.includes('critical') || msg.includes('issue')) {
    if (activeAlerts.length === 0) {
      return `No active alerts at this time. All systems are operating within normal parameters.`;
    }
    const critical = activeAlerts.filter(a => a.severity === 'critical');
    const high = activeAlerts.filter(a => a.severity === 'high');
    return `There are ${activeAlerts.length} active alerts — ${critical.length} critical, ${high.length} high severity. Most recent: "${activeAlerts[0]?.message}". Head to the Tactical Command Center to acknowledge and resolve.`;
  }

  // ── Wait time
  if (msg.includes('wait') || msg.includes('delay') || msg.includes('time')) {
    return `Current average passenger wait time is ${metrics.average_wait_time ?? '—'} minutes across all routes. ${
      metrics.average_wait_time > 6
        ? 'This is above the 5-minute SDG target. Increasing frequency on high-demand routes is recommended.'
        : 'This is within the acceptable SDG 11.2 threshold.'
    }`;
  }

  // ── Efficiency / SDG / performance
  if (msg.includes('efficien') || msg.includes('sdg') || msg.includes('performance') || msg.includes('health')) {
    return `System efficiency index is currently ${metrics.system_efficiency ?? '—'}. Fleet utilization is at ${metrics.fleet_utilization ?? '—'}% with ${metrics.passenger_throughput ?? '—'} passengers currently on board. ${
      metrics.system_efficiency > 70
        ? 'Network is performing well against SDG Goal 11.2 targets.'
        : 'Efficiency is below target. Review underutilized routes and consider rebalancing.'
    }`;
  }

  // ── Metro status
  if (msg.includes('metro') || msg.includes('purple') || msg.includes('line 1')) {
    if (metro.status === 'delayed') {
      return `Metro Purple Line is currently delayed by ${metro.delay_minutes} minutes. This is increasing bus demand in nearby interchange zones. Recommend deploying additional feeder buses at Vanaz, Ramwadi, and Swargate hubs.`;
    }
    if (metro.status === 'crowded') {
      return `Metro Purple Line is running but crowded. Passenger flow is at ${metro.passenger_flow?.toLocaleString() ?? '—'} pax/hr. Bus feeder demand at interchange zones is elevated.`;
    }
    return `Metro Purple Line is operating normally. Passenger flow: ${metro.passenger_flow?.toLocaleString() ?? '—'} pax/hr. Feeder bus synchronization is active across all interchange zones.`;
  }

  // ── Demand / zones / surge
  if (msg.includes('demand') || msg.includes('zone') || msg.includes('surge') || msg.includes('bottleneck')) {
    const surgingZones = zoneStats.filter(z => z.is_surging);
    if (surgingZones.length === 0) {
      return `No demand surges detected across the ${zoneStats.length} monitored zones. Demand is balanced network-wide.`;
    }
    const top = surgingZones.slice(0, 3).map(z => `${z.name} (+${z.surge_percent}%)`).join(', ');
    return `${surgingZones.length} zones are currently surging: ${top}. These zones have predicted demand exceeding current supply by more than 20%. Deploy additional units or increase frequency on serving routes.`;
  }

  // ── Recommendations / optimize
  if (msg.includes('recommend') || msg.includes('optim') || msg.includes('suggest') || msg.includes('deploy')) {
    if (recommendations.length === 0) {
      return `No optimization actions required at this time. The network is in equilibrium.`;
    }
    const top = recommendations[0];
    return `Top recommendation: ${top.reason}. Suggested action: ${top.action?.replace(/_/g, ' ')} on ${top.route_id ?? 'the network'}. Priority: ${top.priority?.toUpperCase()}. View all recommendations in the Tactical Command Center.`;
  }

  // ── Fleet size / buses
  if (msg.includes('fleet') || msg.includes('bus') || msg.includes('vehicle')) {
    return `Fleet has ${buses.length} active vehicles. ${crowdedBuses.length} crowded, ${underusedBuses.length} underutilized, ${buses.length - crowdedBuses.length - underusedBuses.length} running optimally. Fleet utilization: ${metrics.fleet_utilization ?? '—'}%.`;
  }

  // ── Carbon / emission / green
  if (msg.includes('carbon') || msg.includes('emission') || msg.includes('green') || msg.includes('sustainab')) {
    return `The network is operating on a zero-emission electric fleet. Current efficiency index of ${metrics.system_efficiency ?? '—'} contributes directly to SDG Goal 11.2. Optimizing dispatch in high-surge zones can further reduce carbon footprint by an estimated 14.2%.`;
  }

  // ── System check
  if (msg.includes('system') || msg.includes('status') || msg.includes('overview')) {
    return `System status: ${activeAlerts.length} active alerts, ${buses.length} buses online, ${metrics.fleet_utilization ?? '—'}% fleet utilization, ${metrics.average_wait_time ?? '—'} min avg wait. Metro: ${metro.status ?? 'unknown'}. Overall health: ${
      activeAlerts.filter(a => a.severity === 'critical').length > 0 ? 'CRITICAL — immediate action required' :
      activeAlerts.length > 5 ? 'DEGRADED — review alerts' : 'STABLE'
    }.`;
  }

  // ── Fallback
  return `I can help with: overcrowding, alerts, wait times, efficiency, metro status, demand zones, recommendations, fleet overview, and sustainability metrics. Current snapshot — ${buses.length} buses active, ${activeAlerts.length} alerts, efficiency at ${metrics.system_efficiency ?? '—'}.`;
}

// ─── Component ─────────────────────────────────────────────────────────────

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const fleetData = useFleet();

  const suggestions = [
    "How is SDG Goal 11.2 performance?",
    "Which buses are overcrowded?",
    "What are the active alerts?",
    "What is the metro status?",
  ];

  const [chat, setChat] = useState([
    { role: 'assistant', content: 'Salutations. I am the Fleet Orchestration Intelligence. Ask me about overcrowding, alerts, demand zones, metro status, or system efficiency.' }
  ]);

  const handleSend = (overrideMessage) => {
    const text = overrideMessage || message;
    if (!text.trim()) return;

    const newChat = [...chat, { role: 'user', content: text }];
    setChat(newChat);
    setMessage('');

    setTimeout(() => {
      const response = generateResponse(text, fleetData);
      setChat([...newChat, { role: 'assistant', content: response }]);
    }, 400);
  };

  return (
    <>
      {/* Floating Toggle */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-primary text-white rounded-[2.5rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 border-[6px] border-white group"
      >
        <Sparkles size={32} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-[480px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.05)] z-[60] transition-transform duration-500 ease-in-out border-l border-slate-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">

          {/* Header */}
          <div className="p-10 border-b border-slate-50 bg-emerald-50/10">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight text-accent">Optimization AI</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Fleet Context Active</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-3 rounded-2xl hover:bg-slate-100 text-slate-300 transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-pro">
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[1.8rem] text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-white font-bold rounded-tr-none shadow-lg shadow-primary/20'
                    : 'bg-slate-50 text-accent font-bold rounded-tl-none border border-slate-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Footer / Input */}
          <div className="p-10 bg-slate-50/50 border-t border-slate-100">
            <div className="mb-6 flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="px-4 py-2 rounded-full bg-white border border-slate-100 text-[10px] font-black text-text-dim hover:text-primary hover:border-primary/40 transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-300 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about fleet, alerts, demand..."
                className="w-full bg-white border-2 border-slate-100 focus:border-primary rounded-3xl py-6 pl-16 pr-20 text-sm font-black text-accent focus:outline-none transition-all shadow-md focus:shadow-xl"
              />
              <button
                onClick={() => handleSend()}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Send size={20} />
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
              <Leaf size={14} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Powered by live fleet telemetry</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AIAssistant;