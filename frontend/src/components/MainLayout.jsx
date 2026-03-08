import React from 'react';
import SidebarNavigation from './SidebarNavigation';
import AIAssistant from './AIAssistant';

const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-main">
      {/* Global Navigation - Fixed Left */}
      <SidebarNavigation />

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {children}
        <AIAssistant />
      </div>
    </div>
  );
};

export default MainLayout;
