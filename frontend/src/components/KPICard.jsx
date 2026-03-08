import React from 'react';

const KPICard = ({ label, value, unit, icon: Icon, colorClass }) => {
  return (
    <div className="glass p-5 rounded-2xl flex items-center gap-5 min-w-[200px] bg-white border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className={`p-4 rounded-xl ${colorClass || 'bg-primary/10 text-primary'}`}>
        {Icon && <Icon size={24} />}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest font-black text-text-dim mb-1">
          {label}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black tracking-tighter text-accent">{value}</span>
          {unit && <span className="text-xs font-bold text-text-dim lowercase">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
