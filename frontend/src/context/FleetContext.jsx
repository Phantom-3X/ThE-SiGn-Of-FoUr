import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchDashboardData } from '../services/api';

const FleetContext = createContext();

export const FleetProvider = ({ children, interval = 3000 }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const timerRef              = useRef(null);

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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [interval]);

  const value = {
    ...data,
    // Core
    routes:             data?.routes             || [],
    buses:              data?.buses              || [],
    depots:             data?.depots             || [],
    demandZones:        data?.demandZones        || [],
    metro:              data?.metro              || {},
    alerts:             data?.alerts             || [],
    metrics:            data?.metrics            || {},
    metricsFormatted:   data?.metricsFormatted   || {},
    recommendations:    data?.recommendations    || [],
    events:             data?.events             || [],
    routeStats:         data?.routeStats         || [],
    zoneStats:          data?.zoneStats          || [],
    alertStats:         data?.alertStats         || {},
    fleetDistribution:  data?.fleetDistribution  || {},
    systemStatus:       data?.systemStatus       || {},
    predictions:        data?.predictions        || {},

    // Phase 1 — Auto-dispatch
    autoDispatchEnabled: data?.autoDispatchEnabled ?? true,
    autoDispatchLog:     data?.autoDispatchLog    || [],

    // Phase 2 — Optimisation
    optimisationScore: data?.optimisationScore || {},

    // Phase 3 — Blockages
    blockages: data?.blockages || [],

    // Phase 4 — Rickshaws
    rickshaws:           data?.rickshaws           || [],
    rickshawAssignments: data?.rickshawAssignments || [],
    lastMileGaps:        data?.lastMileGaps        || [],

    // Phase 5 — Prediction accuracy
    predictionAccuracy: data?.predictionAccuracy || {},

    // Phase 7 — Surge
    activeSurge:  data?.activeSurge  || null,
    surgeReports: data?.surgeReports || [],

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
