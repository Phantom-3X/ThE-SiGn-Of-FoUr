import React from 'react';

const DashboardLayout = ({ children, sidebar, topbar }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-main">
      {/* Sidebar - Alert Feed / Recommendations */}
      <aside className="dashboard-aside flex flex-col z-20">
        {sidebar}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header / Metrics Bar */}
        <header className="dashboard-header flex items-center px-6 justify-between z-10">
          {topbar}
        </header>

        {/* Dynamic Content (Map, Charts, etc.) */}
        <div className="flex-1 relative overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
