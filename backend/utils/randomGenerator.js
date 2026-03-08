/**
 * randomGenerator.js
 * 
 * Utility functions for generating realistic random values.
 * Used by simulation modules to add variability.
 */

// =============================================================================
// BASIC RANDOM FUNCTIONS
// =============================================================================

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random float between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} decimals - Decimal places (default: 4)
 * @returns {number} Random float
 */
function randomFloat(min, max, decimals = 4) {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

/**
 * Random boolean with custom probability
 * @param {number} probability - Probability of true (0-1)
 * @returns {boolean} Random boolean
 */
function randomChance(probability = 0.5) {
  return Math.random() < probability;
}

// =============================================================================
// VARIATION FUNCTIONS
// =============================================================================

/**
 * Apply random variation to a value
 * @param {number} baseValue - Base value
 * @param {number} variationPercent - Variation range (e.g., 0.15 for ±15%)
 * @returns {number} Value with random variation
 */
function applyVariation(baseValue, variationPercent) {
  const variation = baseValue * variationPercent;
  return baseValue + randomFloat(-variation, variation);
}

/**
 * Generate value with Gaussian-like distribution around mean
 * @param {number} mean - Center value
 * @param {number} stdDev - Standard deviation
 * @returns {number} Random value
 */
function gaussianRandom(mean, stdDev) {
  // Box-Muller transform approximation
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + stdDev * normal;
}

// =============================================================================
// SELECTION FUNCTIONS
// =============================================================================

/**
 * Pick random element from array
 * @param {Array} array - Source array
 * @returns {*} Random element
 */
function randomElement(array) {
  if (!array || array.length === 0) return null;
  return array[randomInt(0, array.length - 1)];
}

/**
 * Pick random element with weighted probabilities
 * @param {Array} items - Array of { item, weight } objects
 * @returns {*} Selected item
 */
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const { item, weight } of items) {
    random -= weight;
    if (random <= 0) return item;
  }
  
  return items[items.length - 1].item;
}

/**
 * Shuffle array in place
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  randomInt,
  randomFloat,
  randomChance,
  applyVariation,
  gaussianRandom,
  randomElement,
  weightedRandom,
  shuffleArray
};