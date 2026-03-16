import { useState, useEffect, useRef } from 'react';
import { fetchDashboardData } from '../services/api';

/**
 * Custom hook to poll fleet data from the backend
 * @param {number} interval Polling interval in milliseconds (default 3000ms)
 */
export const useFleetData = (interval = 3000) => {
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
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Setup interval
    timerRef.current = setInterval(fetchData, interval);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [interval]);

  const refresh = () => fetchData();

  return {
    routes: data?.routes || [],
    buses: data?.buses || [],
    autoRikshawRoutes: data?.autoRikshawRoutes || [],
    autoRikshaws: data?.autoRikshaws || [],
    depots: data?.depots || [],
    demandZones: data?.demandZones || [],
    metro: data?.metro || {},
    alerts: data?.alerts || [],
    metrics: data?.metrics || {},
    events: data?.events || [],
    predictions: data?.predictions || {},
    simulation: data?.simulation || {},
    loading,
    error,
    refresh
  };
};

export default useFleetData;
