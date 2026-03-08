import React from 'react';
import { Lightbulb, Send, TrendingUp, RefreshCw } from 'lucide-react';

const RecommendationsSidebar = ({ recommendations, onAction }) => {
  return (
    <div className="flex flex-col h-full bg-sidebar-alt dashboard-border-l">
      <div className="p-4 dashboard-border-b">
        <h2 className="font-bold flex items-center gap-2 text-sm">
          <Lightbulb size={16} style={{ color: 'var(--warning)' }} />
          AI Insights
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {recommendations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <RefreshCw size={32} className="mb-2" />
            <p className="text-sm">Optimizing...</p>
          </div>
        ) : (
          recommendations.map((rec, idx) => (
            <div 
              key={idx} 
              className="p-4 rounded-xl glass animate-fade-in recommendation-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded bg-dark ${rec.priority === 'urgent' ? 'text-danger' : 'text-primary'}`}>
                  <TrendingUp size={12} />
                </div>
                <span className="text-xs uppercase font-bold tracking-widest opacity-50">
                  {rec.type || 'Fleet Insight'}
                </span>
              </div>
              <p className="text-xs font-semibold mb-3">
                {rec.recommendation || rec.message}
              </p>
              
              {rec.action_params && (
                <button 
                  onClick={() => onAction(rec)}
                  className="btn-primary-ghost w-full"
                >
                  <Send size={12} />
                  Deploy Optimization
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecommendationsSidebar;
