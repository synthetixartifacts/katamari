// Helper functions for the game

/**
 * Generate a random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number between min and max
 */
function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer between min and max
 */
function randomIntInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if the device is mobile
 * @returns {boolean} True if device is mobile, false otherwise
 */
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Calculate the volume of a sphere
 * @param {number} radius - Radius of the sphere
 * @returns {number} Volume of the sphere
 */
function calculateSphereVolume(radius) {
  return (4/3) * Math.PI * Math.pow(radius, 3);
}

/**
 * Calculate new radius from old radius and added volume
 * @param {number} currentRadius - Current radius
 * @param {number} addedVolume - Volume being added
 * @returns {number} New radius
 */
function calculateNewRadius(currentRadius, addedVolume) {
  const currentVolume = calculateSphereVolume(currentRadius);
  const newVolume = currentVolume + addedVolume;
  return Math.pow((3 * newVolume) / (4 * Math.PI), 1/3);
}

/**
 * Get a random color from the rainbow palette
 * @returns {number} Three.js color in hex format
 */
function getRandomRainbowColor() {
  const colors = [
    0xFF0000, // Red
    0xFFA500, // Orange
    0xFFFF00, // Yellow
    0x008000, // Green
    0x0000FF, // Blue
    0x4B0082, // Indigo
    0xEE82EE  // Violet
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}