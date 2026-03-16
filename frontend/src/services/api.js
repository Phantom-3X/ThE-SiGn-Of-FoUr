import axios from 'axios';

const API_BASE_URL = "https://fleet-orchestrator-backend-f4r0.onrender.com/api";

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
  axios.post(`${API_BASE}/rebalance`, { fromRouteId, toRouteId, count });

export const changeFrequency = (routeId, frequency) =>
  axios.post(`${API_BASE}/change-frequency`, { routeId, frequency });

export const acknowledgeAlert = (alertId) => 
  api.post('/acknowledge-alert', { alertId });

export const acknowledgeAllAlerts = () => 
  api.post('/acknowledge-all-alerts');

export const getBusDetails = (busId) =>
  axios.get(`${API_BASE}/buses/${busId}`);

export const emergencyDispatch = (routeId, count) =>
  axios.post(`${API_BASE}/emergency-dispatch`, { routeId, count });

export default api;
