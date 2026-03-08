import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

import MainLayout from './components/MainLayout';
import BusTransition from './components/BusTransition';
import { useFleet } from './context/FleetContext';

// Views
import LiveOps from './views/LiveOps';
import StrategicOverview from './views/StrategicOverview';
import OperationalControl from './views/OperationalControl';
import Analytics from './views/Analytics';
import MultiModal from './views/MultiModal';
import FleetManagement from './views/FleetManagement';

function App() {
  const location = useLocation();
  const { loading, metrics, error } = useFleet();

  if (loading && !metrics.fleet_utilization) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-main">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4"></div>
        <p className="text-primary font-bold uppercase tracking-widest text-[10px]">Initializing Intelligence Core...</p>
      </div>
    );
  }

  return (
    <MainLayout>
      {error && (
        <div className="absolute top-4 left-4 z-50 glass px-4 py-2 rounded-lg border-danger text-danger text-xs flex items-center gap-2">
          <AlertTriangle size={14} />
          Backend Connection Failed. Syncing...
        </div>
      )}

      <BusTransition locationKey={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<LiveOps />} />
          <Route path="/strategic" element={<StrategicOverview />} />
          <Route path="/control-center" element={<OperationalControl />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/multi-modal" element={<MultiModal />} />
          <Route path="/fleet" element={<FleetManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BusTransition>
    </MainLayout>
  );
}

export default App;
