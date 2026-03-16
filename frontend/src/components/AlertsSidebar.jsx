import React, { useMemo, useState } from 'react';
import { AlertCircle, Clock, CheckCircle, Flame } from 'lucide-react';

const AlertsSidebar = ({ alerts, onAcknowledge }) => {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filterOptions = ['all', 'critical', 'high', 'medium', 'low'];
  const categoryOptions = ['all', 'rerouting'];

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const severityMatch = severityFilter === 'all' || (alert.severity || '').toLowerCase() === severityFilter;
      const alertType = (alert.type || '').toLowerCase();
      const categoryMatch = categoryFilter === 'all' || alertType === 'rerouting' || alertType === 'route_change';
      return severityMatch && categoryMatch;
    });
  }, [alerts, severityFilter, categoryFilter]);

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'alert-critical';
      case 'high': return 'alert-high';
      case 'medium': return 'alert-medium';
      case 'low': return 'alert-low';
      default: return 'alert-default';
    }
  };

  const getCount = (option) => {
    if (option === 'all') return alerts.length;
    return alerts.filter(a => (a.severity || '').toLowerCase() === option).length;
  };

  const getCategoryCount = (category) => {
    if (category === 'all') return alerts.length;
    return alerts.filter(a => {
      const type = (a.type || '').toLowerCase();
      return type === 'rerouting' || type === 'route_change';
    }).length;
  };

  const getIcon = (severity) => {
    if (severity === 'critical') return <Flame size={14} />;
    return <AlertCircle size={14} />;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 dashboard-border-b flex justify-between items-center">
        <h2 className="font-bold flex items-center gap-2 text-sm">
          <AlertCircle size={16} style={{ color: 'var(--primary)' }} />
          Live Alerts
        </h2>
        <span className="bg-danger text-xs px-2 py-0.5 rounded-full font-bold">
          {alerts.filter(a => !a.acknowledged).length}
        </span>
      </div>

      <div className="px-4 pt-3 pb-2 dashboard-border-b flex flex-wrap gap-2">
        {categoryOptions.map(option => {
          const isActive = categoryFilter === option;
          return (
            <button
              key={option}
              onClick={() => setCategoryFilter(option)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border transition-colors ${
                isActive
                  ? 'bg-violet-100 border-violet-300 text-violet-700'
                  : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {option} ({getCategoryCount(option)})
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-3 pb-2 dashboard-border-b flex flex-wrap gap-2">
        {filterOptions.map(option => {
          const isActive = severityFilter === option;
          return (
            <button
              key={option}
              onClick={() => setSeverityFilter(option)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border transition-colors ${
                isActive
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {option} ({getCount(option)})
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {filteredAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <CheckCircle size={32} className="mb-2" />
            <p className="text-sm">No alerts for selected filter</p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => (
            <div 
              key={alert.id || idx} 
              className={`p-3 rounded-lg animate-fade-in relative alert-card ${getSeverityClass(alert.severity)}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="flex items-center gap-1 font-bold text-xs uppercase tracking-wider">
                  {getIcon(alert.severity)}
                  {alert.severity}
                </span>
                <span className="text-xs opacity-60 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs font-medium mb-2">
                {alert.message}
              </p>
              <div className="mb-2">
                <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                  {alert.type || 'general'}
                </span>
              </div>
              {!alert.acknowledged && (
                <button 
                  onClick={() => onAcknowledge(alert.id)}
                  className="acknowledge-btn"
                >
                  Acknowledge
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsSidebar;
