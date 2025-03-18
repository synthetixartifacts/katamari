// HUD Controller for Katamari-like game

class HUDController {
  constructor(gameController) {
    this.gameController = gameController;

    // DOM elements
    this.hudElement = document.getElementById('hud');
    this.sphereSizeElement = document.getElementById('sphere-size');

    // Game stats
    this.itemsAbsorbed = 0;
    this.startTime = null;
    this.elapsedTime = 0;

    // Initialize the HUD
    this._initializeHUD();
  }

  _initializeHUD() {
    // Clear existing HUD content
    this.hudElement.innerHTML = '';

    // Create size display
    const sizeDisplay = document.createElement('div');
    sizeDisplay.id = 'size-display';
    sizeDisplay.innerHTML = 'Size: <span id="sphere-size">1</span> meters';
    this.hudElement.appendChild(sizeDisplay);
    this.sphereSizeElement = document.getElementById('sphere-size');

    // Create items counter
    const itemsDisplay = document.createElement('div');
    itemsDisplay.id = 'items-display';
    itemsDisplay.innerHTML = 'Items: <span id="items-count">0</span>';
    this.hudElement.appendChild(itemsDisplay);

    // Create timer
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'timer-display';
    timerDisplay.innerHTML = 'Time: <span id="timer">00:00</span>';
    this.hudElement.appendChild(timerDisplay);

    // Create minimap container
    const minimapContainer = document.createElement('div');
    minimapContainer.id = 'minimap-container';
    minimapContainer.style.width = '150px';
    minimapContainer.style.height = '150px';
    minimapContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    minimapContainer.style.borderRadius = '50%';
    minimapContainer.style.margin = '10px auto';
    minimapContainer.style.position = 'relative';
    minimapContainer.style.overflow = 'hidden';
    this.hudElement.appendChild(minimapContainer);

    // Create player indicator on minimap
    const playerIndicator = document.createElement('div');
    playerIndicator.id = 'player-indicator';
    playerIndicator.style.width = '10px';
    playerIndicator.style.height = '10px';
    playerIndicator.style.backgroundColor = '#FF4500';
    playerIndicator.style.borderRadius = '50%';
    playerIndicator.style.position = 'absolute';
    playerIndicator.style.top = '50%';
    playerIndicator.style.left = '50%';
    playerIndicator.style.transform = 'translate(-50%, -50%)';
    playerIndicator.style.boxShadow = '0 0 5px #FFF';
    minimapContainer.appendChild(playerIndicator);

    // Update references to new elements
    this.itemsCountElement = document.getElementById('items-count');
    this.timerElement = document.getElementById('timer');
    this.playerIndicator = document.getElementById('player-indicator');
    this.minimapContainer = document.getElementById('minimap-container');
  }

  show() {
    this.hudElement.style.display = 'block';
    this.startTime = Date.now();
    this.updateTimer();
  }

  hide() {
    this.hudElement.style.display = 'none';
  }

  updateSphereSize(size) {
    // Safety check for valid sphere size
    if (isNaN(size) || size <= 0) {
      console.error(`Invalid sphere size in HUD: ${size}, resetting to 1`);
      size = 1;
    }

    // Update the sphere size display (rounded to 2 decimal places)
    this.sphereSizeElement.textContent = size.toFixed(2);
  }

  incrementItemsAbsorbed() {
    this.itemsAbsorbed++;
    this.itemsCountElement.textContent = this.itemsAbsorbed;
  }

  updateTimer() {
    if (!this.startTime) return;

    const currentTime = Date.now();
    this.elapsedTime = Math.floor((currentTime - this.startTime) / 1000);

    const minutes = Math.floor(this.elapsedTime / 60).toString().padStart(2, '0');
    const seconds = (this.elapsedTime % 60).toString().padStart(2, '0');

    this.timerElement.textContent = `${minutes}:${seconds}`;

    // Continue updating the timer
    requestAnimationFrame(() => this.updateTimer());
  }

  updateMinimap(playerPosition, mapSize) {
    // Calculate player position on minimap
    // Convert 3D world coordinates to 2D minimap coordinates
    const minimapSize = 150; // Size of the minimap in pixels
    const halfMapSize = mapSize / 2;

    // Calculate normalized position (0-1) and convert to minimap pixels
    const normalizedX = (playerPosition.x + halfMapSize) / mapSize;
    const normalizedZ = (playerPosition.z + halfMapSize) / mapSize;

    const minimapX = normalizedX * minimapSize;
    const minimapY = normalizedZ * minimapSize;

    // Update player indicator position
    this.playerIndicator.style.left = `${minimapX}px`;
    this.playerIndicator.style.top = `${minimapY}px`;
  }
}