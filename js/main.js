// Main entry point for the Katamari-like game

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.debugLog) {
    window.debugLog('DOM fully loaded, initializing game...', 'info');
  }
  
  try {
    // Initialize the game controller
    const game = new GameController();
    
    // Expose game object for debugging
    if (window.debugLog) {
      window.debugGame = game;
      window.debugLog('Game controller initialized successfully', 'success');
    }
    
    // Get UI elements
    const startButton = document.getElementById('start-button');
    const menu = document.getElementById('menu');
    const hud = document.getElementById('hud');
    
    // Setup event listeners
    startButton.addEventListener('click', () => {
      if (window.debugLog) {
        window.debugLog('Start button clicked', 'info');
      }
      
      try {
        // Hide menu, show HUD
        menu.style.display = 'none';
        hud.style.display = 'block';
        
        // Start the game
        game.start();
        
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