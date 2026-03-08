/**
 * geoUtils.js
 * 
 * Utility functions for geographic calculations.
 * Used for bus movement simulation and distance calculations.
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const EARTH_RADIUS_KM = 6371;

// =============================================================================
// DISTANCE CALCULATIONS
// =============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees value
 * @returns {number} Radians value
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// =============================================================================
// INTERPOLATION
// =============================================================================

/**
 * Interpolate position between two points
 * @param {Object} start - Start point { lat, lng }
 * @param {Object} end - End point { lat, lng }
 * @param {number} fraction - Fraction of journey (0-1)
 * @returns {Object} Interpolated position { lat, lng }
 */
function interpolatePosition(start, end, fraction) {
  return {
    lat: start.lat + (end.lat - start.lat) * fraction,
    lng: start.lng + (end.lng - start.lng) * fraction
  };
}

/**
 * Get next position along a route
 * @param {Array} stops - Array of stop coordinates
 * @param {number} currentStopIndex - Current stop index
 * @param {number} progressToNext - Progress to next stop (0-1)
 * @param {number} direction - Direction (1 = forward, -1 = backward)
 * @returns {Object} Next position and updated state
 */
function getNextPosition(stops, currentStopIndex, progressToNext, direction) {
  const currentStop = stops[currentStopIndex];
  const nextStopIndex = currentStopIndex + direction;
  
  // Check if at end of route
  if (nextStopIndex < 0 || nextStopIndex >= stops.length) {
    return {
      position: currentStop,
      stopIndex: currentStopIndex,
      direction: -direction, // Reverse direction
      progress: 0
    };
  }
  
  const nextStop = stops[nextStopIndex];
  const position = interpolatePosition(currentStop, nextStop, progressToNext);
  
  return {
    position,
    stopIndex: currentStopIndex,
    direction,
    progress: progressToNext
  };
}

// =============================================================================
// PROXIMITY CHECKS
// =============================================================================

/**
 * Check if a point is within radius of another point
 * @param {Object} point1 - First point { lat, lng }
 * @param {Object} point2 - Second point { lat, lng }
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean} True if within radius
 */
function isWithinRadius(point1, point2, radiusKm) {
  const distance = calculateDistance(
    point1.lat, point1.lng,
    point2.lat, point2.lng
  );
  return distance <= radiusKm;
}

/**
 * Find nearest point from a list
 * @param {Object} origin - Origin point { lat, lng }
 * @param {Array} points - Array of points with lat, lng
 * @returns {Object} Nearest point with distance
 */
function findNearest(origin, points) {
  let nearest = null;
  let minDistance = Infinity;
  
  for (const point of points) {
    const distance = calculateDistance(
      origin.lat, origin.lng,
      point.lat, point.lng
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = point;
    }
  }
  
  return { point: nearest, distance: minDistance };
}

/**
 * Calculate total route length
 * @param {Array} stops - Array of stop coordinates
 * @returns {number} Total length in kilometers
 */
function calculateRouteLength(stops) {
  let totalLength = 0;
  
  for (let i = 0; i < stops.length - 1; i++) {
    totalLength += calculateDistance(
      stops[i].lat, stops[i].lng,
      stops[i + 1].lat, stops[i + 1].lng
    );
  }
  
  return totalLength;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  calculateDistance,
  toRadians,
  interpolatePosition,
  getNextPosition,
  isWithinRadius,
  findNearest,
  calculateRouteLength,
  EARTH_RADIUS_KM
};