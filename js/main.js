// Main entry point for the Katamari-like game

// Global game configuration
window.GAME_CONFIG = {
  INITIAL_BALL_SIZE: 1, // Starting size in cm
  BALL_SPEED: 10, // Movement speed
  INITIAL_OBJECTS_COUNT: 1500, // Number of objects initially spawned
  MAX_OBJECTS_COUNT: 1500, // Maximum number of objects at any time
  MAP_SIZE: 1000, // Size of the entire map (ground plane)
  PLAYABLE_AREA: 400, // Size of the area where objects can spawn
  MAX_OBJECT_SIZE: 1, // Maximum size of spawnable objects in cm
  RESPAWN_OBJECTS: true, // Whether to respawn objects after they are absorbed
  MAX_SCREEN_PERCENTAGE: 30, // Maximum percentage of screen height the sphere should occupy (0-100)
  CAMERA_ZOOM_RATE: 1.5 // Multiplier for camera distance relative to sphere size
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.debugLog) {
    window.debugLog('DOM fully loaded, initializing game...', 'info');
  }

  try {
    // Initialize the game controller
    const game = new GameController();

    // Always expose game object for debugging
    window.debugGame = game;
    console.log('Game controller initialized and exposed globally as window.debugGame');

    if (window.debugLog) {
      window.debugLog('Game controller initialized successfully', 'success');
    }

    // Get UI elements
    const startButton = document.getElementById('start-button');
    const menu = document.getElementById('menu');

    // Setup event listeners
    startButton.addEventListener('click', () => {
      if (window.debugLog) {
        window.debugLog('Start button clicked', 'info');
      }

      try {
        // Hide menu (HUD will be shown by the HUDController)
        menu.style.display = 'none';

        // Start the game
        game.start();

        // Force an immediate extra render to ensure scene is fully displayed
        game.renderer.render(game.scene, game.cameraController.camera);

        if (window.debugLog) {
          window.debugLog('Game started successfully', 'success');
        }
      } catch (error) {
        if (window.debugLog) {
          window.debugLog(`Error starting game: ${error.message}`, 'error');
        }
        console.error('Error starting game:', error);
      }
    });

  } catch (error) {
    if (window.debugLog) {
      window.debugLog(`Error initializing game: ${error.message}`, 'error');
    }
    console.error('Error initializing game:', error);
  }
});