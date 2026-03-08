import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Map, 
  Settings2, 
  LineChart, 
  TrainFront, 
  LayoutDashboard,
  Box
} from 'lucide-react';

const SidebarNavigation = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Strategic', path: '/strategic' },
    { icon: Map, label: 'Live Ops', path: '/' },
    { icon: Settings2, label: 'Control Center', path: '/control-center' },
    { icon: LineChart, label: 'Analytics', path: '/analytics' },
    { icon: TrainFront, label: 'Multi-Modal', path: '/multi-modal' },
    { icon: Box, label: 'Fleet Management', path: '/fleet' },
  ];

  return (
    <nav className="nav-sidebar">
      <div className="flex items-center justify-center mb-8">
        <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
          <Navigation style={{ color: 'var(--primary)' }} size={24} />
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            <item.icon size={20} />
            <span className="nav-tooltip">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="mt-auto">
        <button className="nav-link bg-transparent border-none cursor-pointer">
          <BarChart3 size={20} />
          <span className="nav-tooltip">System Status</span>
        </button>
      </div>
    </nav>
  );
};

// Internal icon for the logo
const Navigation = ({ size, style }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    style={style}
  >
    <path d="M3 11l19-9-9 19-2-8-8-2z" />
  </svg>
);

export default SidebarNavigation;
