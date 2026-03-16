import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchDashboardData } from '../services/api';

const FleetContext = createContext();

export const FleetProvider = ({ children, interval = 3000 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const fetchData = async () => {
    try {
      const response = await fetchDashboardData();
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching fleet data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interval]);

  const value = {
    ...data,
    routes: data?.routes || [],
    buses: data?.buses || [],
    autoRikshawRoutes: data?.autoRikshawRoutes || [],
    autoRikshaws: data?.autoRikshaws || [],
    depots: data?.depots || [],
    demandZones: data?.demandZones || [],
    metro: data?.metro || {},
    alerts: data?.alerts || [],
    metrics: data?.metrics || {},
    predictions: data?.predictions || {},
    simulation: data?.simulation || {},
    optimization_weights: data?.optimization_weights || { wait_time: 33, fuel_efficiency: 33, empty_km: 34 },
    loading,
    error,
    refresh: fetchData
  };

  return (
    <FleetContext.Provider value={value}>
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
