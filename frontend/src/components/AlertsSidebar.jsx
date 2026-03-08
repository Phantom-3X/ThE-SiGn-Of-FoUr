import React from 'react';
import { AlertCircle, Clock, CheckCircle, Info, Flame } from 'lucide-react';

const AlertsSidebar = ({ alerts, onAcknowledge }) => {
  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'alert-critical';
      case 'high': return 'alert-high';
      case 'medium': return 'alert-medium';
      case 'low': return 'alert-low';
      default: return 'alert-default';
    }
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

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <CheckCircle size={32} className="mb-2" />
            <p className="text-sm">System clear</p>
          </div>
        ) : (
          alerts.map((alert, idx) => (
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
