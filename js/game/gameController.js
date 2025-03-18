// Main Game Controller

class GameController {
  constructor() {
    // Game state variables
    this.isRunning = false;
    this.isPaused = false;
    this.score = 0;
    this.level = 1;
    this.sphereSize = 1.0;

    // Physics options
    this.physicsEngine = 'basic'; // Options: 'basic', 'advanced'
    // TODO: Add CannonJS integration for advanced physics when physicsEngine is set to 'advanced'

    // Initialize game properties
    this.scene = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Player sphere properties
    this.playerSphere = null;

    // Game modules
    this.objectManager = null;
    this.physics = null;
    this.cameraController = null;
    this.inputHandler = null;
    this.hudController = null;

    // DOM elements
    this.mobileControls = document.getElementById('mobile-controls');

    // Setup scene
    this._setupScene();

    // Initialize game systems
    this.physics = new Physics();
    this.objectManager = new ObjectManager(this.scene);

    // Start systems
    window.addEventListener('resize', this._handleResize.bind(this));
  }

  _setupScene() {
    console.log('Setting up scene...');

    // Create Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Shadow map disabled

    // Append canvas to game container instead of body
    const gameContainer = document.getElementById('game-container');
    gameContainer.appendChild(this.renderer.domElement);

    // Position the canvas
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '1'; // Lower than UI elements

    // Create clock for timing
    this.clock = new THREE.Clock();

    // Add lighting
    this._setupLights();

    // Create ground plane
    this._createGround();

    // Create camera controller
    this.cameraController = new CameraController(this.sphereSize);
    this.scene.add(this.cameraController.camera);

    // Initialize other modules
    this.objectManager = new ObjectManager(this.scene);
    this.physics = new Physics();

    // Add resize handler
    window.addEventListener('resize', () => this._handleResize());

    // Do an initial render
    this.renderer.render(this.scene, this.cameraController.camera);

    console.log('Scene setup complete');
  }

  _setupLights() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Add directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    // Removed shadow casting

    this.scene.add(dirLight);
  }

  _createGround() {
    // Create ground plane using the configurable map size
    const mapSize = window.GAME_CONFIG.MAP_SIZE;
    const groundGeometry = new THREE.PlaneGeometry(mapSize, mapSize);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x7CFC00,  // Light green
      roughness: 0.8,
      metalness: 0.2
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = -0.5;
    // Removed receiveShadow

    this.scene.add(ground);
  }

  _createPlayerSphere() {
    console.log('Creating player sphere...');

    // Create the player's sticky sphere
    const sphereGeometry = new THREE.SphereGeometry(this.sphereSize, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4500,  // Orange-red
      roughness: 0.4,
      metalness: 0.3
    });

    this.playerSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.playerSphere.position.set(0, this.sphereSize + 0.5, 0); // Position above ground
    // Removed castShadow and receiveShadow from player sphere

    // Store the sphere's current velocity
    this.playerSphere.userData.velocity = new THREE.Vector3();

    this.scene.add(this.playerSphere);
    console.log('Player sphere created and added to scene');
  }

  _handleResize() {
    // Update renderer and camera on window resize
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.cameraController.camera.aspect = width / height;
    this.cameraController.camera.updateProjectionMatrix();

    // Force a re-render after resize to prevent black screen
    if (this.scene && this.cameraController && this.cameraController.camera) {
      this.renderer.render(this.scene, this.cameraController.camera);
    }
  }

  start() {
    console.log('Game starting...');

    // Create player sphere
    this._createPlayerSphere();

    // Initialize input handler with camera controller
    this.inputHandler = new InputHandler(this.playerSphere, this.cameraController);
    
    // Initialize HUD controller
    this.hudController = new HUDController(this);
    this.hudController.show();

    // Spawn initial objects
    this.objectManager.spawnInitialObjects(this.sphereSize);

    // Start game loop
    this.isRunning = true;
    this._gameLoop();

    // Check if mobile device and show controls if needed
    if (isMobileDevice()) {
      this.mobileControls.style.display = 'block';
      this.inputHandler.setupMobileControls();
    }

    console.log('Game started successfully');
  }

  _gameLoop() {
    if (!this.isRunning) return;

    // Calculate delta time
    const delta = this.clock.getDelta();

    // Update input & movement
    this.inputHandler.update(delta);

    // Check collisions
    const collisions = this.physics.checkCollisions(
      this.playerSphere,
      this.objectManager.objects,
      this.sphereSize
    );

    // Apply physics (after collision checks which might affect velocity)
    this.physics.applyPhysics(this.playerSphere, delta);

    // Handle collisions
    if (collisions.length > 0) {
      this._handleCollisions(collisions);
    }

    // Update camera position
    this.cameraController.update(this.playerSphere, delta);
    
    // Update minimap with player position
    if (this.hudController) {
      this.hudController.updateMinimap(
        this.playerSphere.position,
        window.GAME_CONFIG.MAP_SIZE
      );
    }

    // Render scene
    this.renderer.render(this.scene, this.cameraController.camera);

    // Continue game loop
    requestAnimationFrame(() => this._gameLoop());
  }

  _handleCollisions(collisions) {
    // Process each collision
    collisions.forEach(object => {
      try {
        // Calculate size increase based on absorbed object volume
        let objectVolume;

        // Different calculation based on object geometry type
        if (object.geometry instanceof THREE.SphereGeometry) {
          // For spheres, use the standard sphere volume formula
          const radius = object.userData.size;
          objectVolume = Math.pow(radius, 3) * Math.PI * (4/3);

          if (window.debugLog) {
            window.debugLog(`Absorbing sphere of size ${radius.toFixed(2)}, volume: ${objectVolume.toFixed(2)}`);
          }
        }
        else if (object.geometry instanceof THREE.BoxGeometry) {
          // For boxes, use the cube volume formula
          const size = object.userData.size;
          objectVolume = Math.pow(size, 3);

          if (window.debugLog) {
            window.debugLog(`Absorbing box of size ${size.toFixed(2)}, volume: ${objectVolume.toFixed(2)}`);
          }
        }
        else if (object.geometry instanceof THREE.ConeGeometry) {
          // For cones, use the cone volume formula: (1/3) * π * r² * h
          const radius = object.userData.size;
          const height = object.userData.size * 2;
          objectVolume = (1/3) * Math.PI * Math.pow(radius, 2) * height;

          if (window.debugLog) {
            window.debugLog(`Absorbing cone of radius ${radius.toFixed(2)}, height ${height.toFixed(2)}, volume: ${objectVolume.toFixed(2)}`);
          }
        }
        else if (object.geometry instanceof THREE.CylinderGeometry) {
          // For cylinders, use the cylinder volume formula: π * r² * h
          const radius = object.userData.size;
          const height = object.userData.size * 2;
          objectVolume = Math.PI * Math.pow(radius, 2) * height;

          if (window.debugLog) {
            window.debugLog(`Absorbing cylinder of radius ${radius.toFixed(2)}, height ${height.toFixed(2)}, volume: ${objectVolume.toFixed(2)}`);
          }
        }
        else {
          // Fallback: use a simple approximation based on user data
          objectVolume = Math.pow(object.userData.size, 3) * 0.5;

          if (window.debugLog) {
            window.debugLog(`Absorbing unknown shape of size ${object.userData.size.toFixed(2)}, estimated volume: ${objectVolume.toFixed(2)}`);
          }
        }

        // Safety check for valid volume
        if (isNaN(objectVolume) || objectVolume <= 0) {
          if (window.debugLog) {
            window.debugLog(`Invalid object volume detected: ${objectVolume}, using default value`, 'warning');
          }
          objectVolume = 1.0; // Use a small default value
        }

        // Calculate current sphere volume
        const currentVolume = Math.pow(this.sphereSize, 3) * Math.PI * (4/3);

        // New volume = current volume + object volume
        const newVolume = currentVolume + objectVolume;

        // New radius from new volume
        const newSize = Math.pow((3 * newVolume) / (4 * Math.PI), 1/3);

        // Safety check for valid size
        if (isNaN(newSize) || newSize <= 0) {
          if (window.debugLog) {
            window.debugLog(`Invalid new size calculated: ${newSize}, keeping current size`, 'error');
          }
          return; // Skip this collision
        }

        if (window.debugLog) {
          window.debugLog(`Sphere growing from ${this.sphereSize.toFixed(2)} to ${newSize.toFixed(2)}`);
        }

        // Update sphere size
        this.growSphere(newSize);

        // Remove the absorbed object
        this.objectManager.removeObject(object);
        
        // Increment absorbed items counter in HUD
        if (this.hudController) {
          this.hudController.incrementItemsAbsorbed();
        }
      } catch (error) {
        if (window.debugLog) {
          window.debugLog(`Error processing collision: ${error.message}`, 'error');
        }
        console.error('Error processing collision:', error);
      }
    });

    // Update HUD
    this._updateHUD();

    // Possibly spawn new objects based on new size (if respawning is enabled)
    this.objectManager.checkAndSpawnObjects(this.sphereSize);
  }

  growSphere(newSize) {
    // Safety check for valid size
    if (isNaN(newSize) || newSize <= 0) {
      console.error("Invalid sphere size:", newSize);
      return;
    }

    // Update the sphere size
    this.sphereSize = newSize;

    try {
      // Update the sphere geometry
      this.scene.remove(this.playerSphere);

      // Create new sphere with updated size
      const sphereGeometry = new THREE.SphereGeometry(this.sphereSize, 32, 32);
      const sphereMaterial = this.playerSphere.material;

      // Keep current position and velocity
      const position = this.playerSphere.position.clone();
      const velocity = this.playerSphere.userData.velocity.clone();

      // Create new sphere
      this.playerSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      this.playerSphere.position.copy(position);
      this.playerSphere.userData.velocity = velocity;

      // Ensure sphere is above ground
      if (this.playerSphere.position.y < this.sphereSize) {
        this.playerSphere.position.y = this.sphereSize;
      }

      this.scene.add(this.playerSphere);

      // Update input handler with new sphere reference
      if (this.inputHandler) {
        this.inputHandler.updatePlayerSphere(this.playerSphere);
      }

      // Update camera distance based on new size
      this.cameraController.updateCameraForSize(this.sphereSize);

    } catch (error) {
      if (window.debugLog) {
        window.debugLog(`Error growing sphere: ${error.message}`, 'error');
      }
      console.error('Error growing sphere:', error);
    }
  }

  _updateHUD() {
    // Update HUD with current sphere size
    if (this.hudController) {
      this.hudController.updateSphereSize(this.sphereSize);
    }
  }
}