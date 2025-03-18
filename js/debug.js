// Enhanced debugging utility for Katamari game
console.log('Debug script loaded');

// Create debug panel
const debugPanel = document.createElement('div');
debugPanel.style.position = 'fixed';
debugPanel.style.top = '10px';
debugPanel.style.right = '10px';
debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
debugPanel.style.color = 'white';
debugPanel.style.padding = '10px';
debugPanel.style.fontFamily = 'monospace';
debugPanel.style.zIndex = '1000';
debugPanel.style.maxHeight = '90vh';
debugPanel.style.overflowY = 'auto';
debugPanel.style.fontSize = '12px';
debugPanel.style.lineHeight = '1.4';
debugPanel.style.borderRadius = '5px';
debugPanel.style.maxWidth = '400px';
document.body.appendChild(debugPanel);

// Debug log function
function debugLog(message, type = 'info') {
  const logLine = document.createElement('div');
  
  // Timestamp
  const time = new Date().toTimeString().split(' ')[0];
  
  // Style based on type
  let color = 'white';
  let prefix = '';
  
  switch (type) {
    case 'error':
      color = '#ff5555';
      prefix = '❌ ';
      console.error(message);
      break;
    case 'warning':
      color = '#ffaa00';
      prefix = '⚠️ ';
      console.warn(message);
      break;
    case 'success':
      color = '#55ff55';
      prefix = '✅ ';
      console.log(message);
      break;
    default:
      prefix = '🔹 ';
      console.log(message);
  }
  
  logLine.style.color = color;
  logLine.style.marginBottom = '4px';
  logLine.style.whiteSpace = 'pre-wrap';
  logLine.style.wordBreak = 'break-word';
  logLine.textContent = `${time} ${prefix}${message}`;
  
  debugPanel.appendChild(logLine);
  debugPanel.scrollTop = debugPanel.scrollHeight;
}

// Check if Three.js is loaded
if (typeof THREE === 'undefined') {
  debugLog('THREE is not defined - Three.js library not loaded properly', 'error');
} else {
  debugLog('Three.js loaded correctly', 'success');
}

// Test Three.js scene creation
try {
  const testScene = new THREE.Scene();
  debugLog('Successfully created a Three.js scene', 'success');
  
  // Test renderer creation
  try {
    const testRenderer = new THREE.WebGLRenderer();
    debugLog('Successfully created WebGL renderer', 'success');
    testRenderer.dispose(); // Clean up
  } catch (renderError) {
    debugLog(`Error creating WebGL renderer: ${renderError.message}`, 'error');
  }
  
} catch (error) {
  debugLog(`Error creating Three.js scene: ${error.message}`, 'error');
}

// Check if WebGL is supported
function checkWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

if (checkWebGL()) {
  debugLog('WebGL is supported', 'success');
} else {
  debugLog('WebGL is not supported in this browser!', 'error');
}

// Function to display any errors in the DOM
window.addEventListener('error', function(event) {
  debugLog(`${event.message} at ${event.filename}:${event.lineno}`, 'error');
});

// Monitor game object
window.debugGame = null;

// Function to inspect game state
function inspectGame() {
  if (!window.debugGame) {
    debugLog('Game object not available yet', 'warning');
    return;
  }
  
  const game = window.debugGame;
  
  // Scene info
  debugLog(`Scene objects: ${game.scene.children.length}`);
  
  // Player info
  if (game.playerSphere) {
    debugLog(`Player size: ${game.sphereSize.toFixed(2)}`);
    debugLog(`Player position: ${game.playerSphere.position.x.toFixed(2)}, ${game.playerSphere.position.y.toFixed(2)}, ${game.playerSphere.position.z.toFixed(2)}`);
  } else {
    debugLog('Player sphere not created yet', 'warning');
  }
  
  // Objects info
  if (game.objectManager) {
    debugLog(`Objects: ${game.objectManager.objects.length}`);
  }
}

// Add inspect button
const inspectButton = document.createElement('button');
inspectButton.textContent = 'Inspect Game State';
inspectButton.style.marginTop = '10px';
inspectButton.style.padding = '5px';
inspectButton.style.backgroundColor = '#007bff';
inspectButton.style.border = 'none';
inspectButton.style.borderRadius = '3px';
inspectButton.style.color = 'white';
inspectButton.style.cursor = 'pointer';
inspectButton.onclick = inspectGame;
debugPanel.appendChild(inspectButton);

// Expose debug function globally
window.debugLog = debugLog;