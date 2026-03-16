import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import SidebarNavigation from './SidebarNavigation';
import AIAssistant from './AIAssistant';

const MainLayout = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-main">
      {/* Global Navigation - Fixed Left */}
      <SidebarNavigation />

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <button
          onClick={() => setIsDarkMode(prev => !prev)}
          className="absolute top-4 right-4 z-[1200] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-sm"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-slate-600" />}
          <span className="text-[10px] font-black uppercase tracking-widest text-accent">
            {isDarkMode ? 'Dark Mode On' : 'Dark Mode Off'}
          </span>
        </button>
        {children}
        <AIAssistant />
      </div>
    </div>
  );
};

export default MainLayout;
