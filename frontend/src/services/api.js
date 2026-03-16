/**
 * api.js
 *
 * Axios client for the Fleet Orchestrator backend.
 * Fixed: all POST functions now use the `api` axios instance, not the
 * undefined `API_BASE` variable that caused ReferenceErrors.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://fleet-orchestrator-backend-f4r0.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// ─── Data retrieval ─────────────────────────────────────────────────────────

export const fetchDashboardData  = ()             => api.get('/dashboard');
export const fetchRoutes         = ()             => api.get('/routes');
export const fetchBuses          = (params = {})  => api.get('/buses', { params });
export const fetchBusDetails     = (busId)        => api.get(`/buses/${busId}`);
export const fetchDepots         = ()             => api.get('/depots');
export const fetchDemandZones    = ()             => api.get('/demand');
export const fetchMetroStatus    = ()             => api.get('/metro');
export const fetchAlerts         = ()             => api.get('/alerts');
export const fetchRecommendations= ()             => api.get('/recommendations');
export const fetchMetrics        = ()             => api.get('/metrics');
export const fetchRouteStats     = ()             => api.get('/route-stats');
export const fetchSystemStatus   = ()             => api.get('/system-status');
export const fetchPredictions    = ()             => api.get('/predictions');
export const fetchPredictionAccuracy = ()         => api.get('/prediction-accuracy');
export const fetchOptimisationScore  = ()         => api.get('/optimisation-score');
export const fetchBlockages      = ()             => api.get('/blockages');
export const fetchRickshaws      = ()             => api.get('/rickshaws');
export const fetchAutoDispatchLog= ()             => api.get('/auto-dispatch-log');
export const fetchSurgeReports   = ()             => api.get('/surge-reports');

// ─── Operator actions ────────────────────────────────────────────────────────

export const deployBus          = (depotId, routeId) => api.post('/deploy-bus', { depotId, routeId });
export const returnBus          = (busId, depotId)   => api.post('/return-bus', { busId, depotId });
export const rebalanceBuses     = (fromRouteId, toRouteId, count) => api.post('/rebalance', { fromRouteId, toRouteId, count });
export const changeFrequency    = (routeId, frequency)           => api.post('/change-frequency', { routeId, frequency });
export const emergencyDispatch  = (routeId, count)               => api.post('/emergency-dispatch', { routeId, count });
export const acknowledgeAlert   = (alertId)                      => api.post('/acknowledge-alert', { alertId });
export const acknowledgeAllAlerts = ()                           => api.post('/acknowledge-all-alerts');

// Phase 1 — Auto-dispatch
export const toggleAutoDispatch = (enabled) => api.post('/toggle-auto-dispatch', { enabled });

// Phase 2 — Optimisation weights
export const setOptimisationWeights = (w1, w2, w3) => api.post('/optimisation-weights', { w1, w2, w3 });

// Phase 3 — Blockage management
export const clearBlockage = (blockage_id) => api.post('/clear-blockage', { blockage_id });

// Phase 7 — Surge
export const triggerSurge = (zone_id) => api.post('/trigger-surge', { zone_id });

export const getBusDetails = (busId) => api.get(`/buses/${busId}`);

export default api;
