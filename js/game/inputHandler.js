// Input Handler - Manages keyboard and mobile inputs

class InputHandler {
  constructor(playerSphere, cameraController) {
    this.playerSphere = playerSphere;
    this.cameraController = cameraController;
    this.keys = {};
    this.moveSpeed = window.GAME_CONFIG.BALL_SPEED; // Use global config
    this.rotationSpeed = 1.5; // Camera rotation speed (radians per second)
    
    // Mobile touch controls
    this.touchControls = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    
    // Mobile tilt controls
    this.usingTilt = false;
    this.tiltSensitivity = 5;
    
    // Set up event listeners
    this._setupKeyboardEvents();
  }
  
  _setupKeyboardEvents() {
    // Key down event
    window.addEventListener('keydown', (event) => {
      // Store the key state
      this.keys[event.key] = true;
    });
    
    // Key up event
    window.addEventListener('keyup', (event) => {
      // Clear the key state
      this.keys[event.key] = false;
    });
  }
  
  setupMobileControls() {
    // Try to setup device orientation (tilt) controls first
    if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ requires permission
      window.DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            this._setupDeviceOrientationEvents();
            this.usingTilt = true;
          } else {
            this._setupTouchControls(); // Fallback to touch
          }
        })
        .catch(error => {
          console.error('Error requesting device orientation permission:', error);
          this._setupTouchControls(); // Fallback to touch
        });
    } else if (window.DeviceOrientationEvent) {
      // Other devices that support orientation without permission
      this._setupDeviceOrientationEvents();
      this.usingTilt = true;
    } else {
      // Fallback to touch controls
      this._setupTouchControls();
    }
  }
  
  _setupDeviceOrientationEvents() {
    window.addEventListener('deviceorientation', (event) => {
      // Beta is front-to-back tilt in degrees, where front is positive
      // Gamma is left-to-right tilt in degrees, where right is positive
      
      const beta = event.beta;  // -180 to 180 (front/back)
      const gamma = event.gamma; // -90 to 90 (left/right)
      
      if (beta !== null && gamma !== null) {
        // Apply tilt values to movement
        this.touchControls.up = beta < -10;
        this.touchControls.down = beta > 10;
        this.touchControls.left = gamma < -10;
        this.touchControls.right = gamma > 10;
      }
    });
  }
  
  _setupTouchControls() {
    // Get button elements
    const upButton = document.getElementById('up-button');
    const downButton = document.getElementById('down-button');
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    
    // Up button events
    upButton.addEventListener('touchstart', () => this.touchControls.up = true);
    upButton.addEventListener('touchend', () => this.touchControls.up = false);
    
    // Down button events
    downButton.addEventListener('touchstart', () => this.touchControls.down = true);
    downButton.addEventListener('touchend', () => this.touchControls.down = false);
    
    // Left button events
    leftButton.addEventListener('touchstart', () => this.touchControls.left = true);
    leftButton.addEventListener('touchend', () => this.touchControls.left = false);
    
    // Right button events
    rightButton.addEventListener('touchstart', () => this.touchControls.right = true);
    rightButton.addEventListener('touchend', () => this.touchControls.right = false);
    
    // Prevent default behavior for touch events on these buttons
    const buttons = [upButton, downButton, leftButton, rightButton];
    buttons.forEach(button => {
      button.addEventListener('touchstart', (e) => e.preventDefault());
      button.addEventListener('touchend', (e) => e.preventDefault());
    });
  }
  
  update(delta) {
    if (!this.cameraController || !this.playerSphere) return;
    
    // Get current forward direction based on camera angle
    const cameraAngle = this.cameraController.rotationAngle;
    
    // Get current velocity
    const velocity = this.playerSphere.userData.velocity;
    
    // Store any existing sideways momentum from collisions
    const existingVelocityX = velocity.x;
    const existingVelocityZ = velocity.z;
    
    // Reset velocity for movement control
    velocity.x = 0;
    velocity.z = 0;
    
    // Handle camera rotation (left/right inputs)
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'] || this.touchControls.left) {
      // Rotate camera counter-clockwise
      this.cameraController.rotateCamera(this.rotationSpeed * delta);
    }
    
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'] || this.touchControls.right) {
      // Rotate camera clockwise
      this.cameraController.rotateCamera(-this.rotationSpeed * delta);
    }
    
    // Calculate movement direction vectors
    const forward = new THREE.Vector3(
      -Math.sin(cameraAngle),
      0,
      -Math.cos(cameraAngle)
    ).normalize();
    
    const right = new THREE.Vector3(
      -Math.sin(cameraAngle + Math.PI/2),
      0,
      -Math.cos(cameraAngle + Math.PI/2)
    ).normalize();
    
    // Handle forward/backward movement (always relative to camera view)
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'] || this.touchControls.up) {
      // Move forward in the direction the camera is facing
      velocity.x += forward.x * this.moveSpeed * delta;
      velocity.z += forward.z * this.moveSpeed * delta;
    }
    
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S'] || this.touchControls.down) {
      // Move backward from the direction the camera is facing
      velocity.x -= forward.x * this.moveSpeed * delta;
      velocity.z -= forward.z * this.moveSpeed * delta;
    }
    
    // Restore any collision momentum (damped to avoid excessive velocity)
    if (Math.abs(existingVelocityX) > 0.01 || Math.abs(existingVelocityZ) > 0.01) {
      velocity.x += existingVelocityX * 0.8; // Damping factor of 0.8
      velocity.z += existingVelocityZ * 0.8;
    }
    
    // Apply physics (gravity, etc.)
    this._applyPhysics(delta);
  }
  
  _applyPhysics(delta) {
    // Get references
    const velocity = this.playerSphere.userData.velocity;
    const radius = this.playerSphere.geometry.parameters.radius;
    
    // Apply gravity if above ground
    if (this.playerSphere.position.y > radius) {
      velocity.y -= 9.8 * delta; // Simple gravity
    } else {
      // On ground, set position and zero Y velocity
      this.playerSphere.position.y = radius;
      velocity.y = 0;
    }
    
    // Apply velocity to position
    this.playerSphere.position.x += velocity.x;
    this.playerSphere.position.y += velocity.y;
    this.playerSphere.position.z += velocity.z;
    
    // Rotate sphere based on movement (if moving)
    if (Math.abs(velocity.x) > 0.01 || Math.abs(velocity.z) > 0.01) {
      // Calculate movement direction in relation to sphere
      const movementDirection = new THREE.Vector3(velocity.x, 0, velocity.z).normalize();
      
      // Calculate rotation axis (perpendicular to movement)
      const rotationAxis = new THREE.Vector3(-movementDirection.z, 0, movementDirection.x);
      
      // Calculate rotation amount
      const speed = new THREE.Vector3(velocity.x, 0, velocity.z).length();
      const rotationAmount = speed / radius;
      
      // Apply rotation
      this.playerSphere.rotateOnAxis(rotationAxis, rotationAmount);
    }
  }
  
  updatePlayerSphere(newSphere) {
    // Update reference when the sphere is recreated (after growing)
    this.playerSphere = newSphere;
  }
  
  setCameraController(cameraController) {
    this.cameraController = cameraController;
  }
}