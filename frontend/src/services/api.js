import axios from 'axios';

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// GET endpoints
export const fetchDashboardData = () => api.get('/dashboard');
export const fetchRoutes = () => api.get('/routes');
export const fetchBuses = () => api.get('/buses');
export const fetchRikshawRoutes = () => api.get('/rikshaw-routes');
export const fetchRikshaws = () => api.get('/rikshaws');
export const fetchDepots = () => api.get('/depots');
export const fetchAlerts = () => api.get('/alerts');
export const fetchMetrics = () => api.get('/metrics');
export const fetchRecommendations = () => api.get('/recommendations');
export const fetchPredictions = () => api.get('/predictions');

// POST endpoints (Fleet Actions)
export const deployBus = (depotId, routeId) => 
  api.post('/deploy-bus', { depotId, routeId });

export const returnBus = (busId, depotId) => 
  api.post('/return-bus', { busId, depotId });

export const rebalanceBuses = (fromRouteId, toRouteId, count) =>
  axios.post(`${API_BASE_URL}/rebalance`, { fromRouteId, toRouteId, count });

export const rerouteBus = (busId, routeId) =>
  axios.post(`${API_BASE_URL}/reroute-bus`, { busId, routeId });

export const changeFrequency = (routeId, frequency) =>
  axios.post(`${API_BASE_URL}/change-frequency`, { routeId, frequency });

export const acknowledgeAlert = (alertId) => 
  api.post('/acknowledge-alert', { alertId });

export const acknowledgeAllAlerts = () => 
  api.post('/acknowledge-all-alerts');

export const getBusDetails = (busId) =>
  axios.get(`${API_BASE_URL}/buses/${busId}`);

export const triggerEvent = (zoneId, type, durationMinutes) =>
  axios.post(`${API_BASE_URL}/trigger-event`, { zoneId, type, durationMinutes });

export const emergencyDispatch = (routeId, count) =>
  axios.post(`${API_BASE_URL}/emergency-dispatch`, { routeId, count });

export const updateOptimizationWeights = (wait_time, fuel_efficiency, empty_km) =>
  axios.post(`${API_BASE_URL}/optimization-weights`, { wait_time, fuel_efficiency, empty_km });

export const blockRoute = (routeId) =>
  axios.post(`${API_BASE_URL}/block-route`, { routeId });

export const unblockRoute = (routeId) =>
  axios.post(`${API_BASE_URL}/unblock-route`, { routeId });

export default api;
