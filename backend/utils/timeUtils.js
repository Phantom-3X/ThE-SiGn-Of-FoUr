/**
 * timeUtils.js
 * 
 * Utility functions for time-based calculations.
 * Used for rush hour detection and simulation timing.
 */

const { RUSH_HOURS } = require("../config/simulationConfig");

// =============================================================================
// TIME GETTERS
// =============================================================================

/**
 * Get current hour (0-23)
 * @returns {number} Current hour
 */
function getCurrentHour() {
  return new Date().getHours();
}

/**
 * Get current minute (0-59)
 * @returns {number} Current minute
 */
function getCurrentMinute() {
  return new Date().getMinutes();
}

/**
 * Get current time as decimal hour (e.g., 9:30 = 9.5)
 * @returns {number} Decimal hour
 */
function getDecimalHour() {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

// =============================================================================
// RUSH HOUR DETECTION
// =============================================================================

/**
 * Check if current time is during morning rush hour
 * @returns {boolean} True if morning rush
 */
function isMorningRush() {
  const hour = getCurrentHour();
  return hour >= RUSH_HOURS.morning.start && hour < RUSH_HOURS.morning.end;
}

/**
 * Check if current time is during evening rush hour
 * @returns {boolean} True if evening rush
 */
function isEveningRush() {
  const hour = getCurrentHour();
  return hour >= RUSH_HOURS.evening.start && hour < RUSH_HOURS.evening.end;
}

/**
 * Check if current time is during any rush hour
 * @returns {boolean} True if rush hour
 */
function isRushHour() {
  return isMorningRush() || isEveningRush();
}

/**
 * Get rush hour type
 * @returns {string} "morning", "evening", or "none"
 */
function getRushHourType() {
  if (isMorningRush()) return "morning";
  if (isEveningRush()) return "evening";
  return "none";
}

// =============================================================================
// TIME CALCULATIONS
// =============================================================================

/**
 * Calculate minutes until next rush hour
 * @returns {number} Minutes until rush hour (0 if currently rush hour)
 */
function getMinutesUntilRushHour() {
  if (isRushHour()) return 0;
  
  const currentHour = getDecimalHour();
  
  // Check morning rush
  if (currentHour < RUSH_HOURS.morning.start) {
    return (RUSH_HOURS.morning.start - currentHour) * 60;
  }
  
  // Check evening rush
  if (currentHour < RUSH_HOURS.evening.start) {
    return (RUSH_HOURS.evening.start - currentHour) * 60;
  }
  
  // After evening rush, calculate until next morning
  return ((24 - currentHour) + RUSH_HOURS.morning.start) * 60;
}

/**
 * Check if it's night time (low demand period)
 * @returns {boolean} True if night time (10 PM - 6 AM)
 */
function isNightTime() {
  const hour = getCurrentHour();
  return hour >= 22 || hour < 6;
}

/**
 * Get time period label
 * @returns {string} Current time period
 */
function getTimePeriod() {
  if (isNightTime()) return "night";
  if (isMorningRush()) return "morning_rush";
  if (isEveningRush()) return "evening_rush";
  return "normal";
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format timestamp for logging
 * @param {Date} date - Date object (default: now)
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

/**
 * Format duration in minutes to human readable
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
function formatDuration(minutes) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  getCurrentHour,
  getCurrentMinute,
  getDecimalHour,
  isMorningRush,
  isEveningRush,
  isRushHour,
  getRushHourType,
  getMinutesUntilRushHour,
  isNightTime,
  getTimePeriod,
  formatTimestamp,
  formatDuration
};