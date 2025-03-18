// Camera Controller - Manages camera position and follows player

class CameraController {
  constructor(initialSphereSize) {
    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      window.GAME_CONFIG.MAP_SIZE * 2 // Far clipping plane based on map size
    );

    // Camera fixed position parameters
    this.distance = 20;
    this.height = 10;
    this.rotationAngle = 0; // Camera rotation angle in radians
    
    // Size thresholds for camera adjustments - scaled based on map size
    const mapScale = Math.max(1, window.GAME_CONFIG.MAP_SIZE / 1000);
    this.sizeThresholds = [
      { size: 5, distance: 25 * mapScale, height: 12 * mapScale },
      { size: 10, distance: 35 * mapScale, height: 15 * mapScale },
      { size: 20, distance: 50 * mapScale, height: 25 * mapScale },
      { size: 40, distance: 70 * mapScale, height: 40 * mapScale }
    ];
    
    // Initial camera setup
    this.updateCameraForSize(initialSphereSize);
    this.updateCameraPosition();
  }
  
  // Set camera rotation angle (in radians)
  setRotationAngle(angle) {
    this.rotationAngle = angle;
    this.updateCameraPosition();
  }
  
  // Rotate camera by specified amount (in radians)
  rotateCamera(angleChange) {
    this.rotationAngle += angleChange;
    this.updateCameraPosition();
  }

  // Update camera position based on player position and current rotation angle
  update(playerSphere) {
    if (!playerSphere) return;
    
    // Get player's current position
    const playerPos = playerSphere.position.clone();
    
    // Calculate camera target position (player position)
    this.camera.lookAt(playerPos);
    
    // Get the current sphere geometry to check its size
    if (playerSphere.geometry && playerSphere.geometry.parameters) {
      const currentSphereSize = playerSphere.geometry.parameters.radius;
      
      // Check if we need to update camera based on the current sphere size
      this.updateCameraForSize(currentSphereSize);
    }
    
    // Update camera position around player based on rotation angle
    this.updateCameraPosition(playerPos);
  }
  
  // Update camera position based on player position and rotation angle
  updateCameraPosition(playerPos = new THREE.Vector3(0, 0, 0)) {
    // Calculate camera position based on distance, height and rotation angle
    const x = playerPos.x + this.distance * Math.sin(this.rotationAngle);
    const z = playerPos.z + this.distance * Math.cos(this.rotationAngle);
    
    // Set camera position
    this.camera.position.set(x, playerPos.y + this.height, z);
    
    // Look at player
    this.camera.lookAt(playerPos);
  }

  updateCameraForSize(sphereSize) {
    // Safety check for sphereSize
    if (isNaN(sphereSize) || sphereSize <= 0) {
      console.warn("Invalid sphere size in camera update:", sphereSize);
      sphereSize = 1; // Default to a reasonable value
    }
    
    // Get the max screen percentage from config
    const maxScreenPercentage = window.GAME_CONFIG.MAX_SCREEN_PERCENTAGE || 30;
    const zoomRate = window.GAME_CONFIG.CAMERA_ZOOM_RATE || 1.5;
    
    // Calculate the camera distance needed based on the sphere size
    // to keep the sphere at the desired screen percentage
    
    // First get the viewport height at the current camera position
    // Using the formula: 2 * Math.tan(FOV_RADIANS / 2) * distance
    const fovRadians = this.camera.fov * Math.PI / 180;
    
    // Calculate the base distance needed to maintain the desired screen percentage
    // Formula: sphere size / (max screen percentage / 100) / (2 * tan(fov/2))
    const baseDistance = sphereSize / (maxScreenPercentage / 100) / Math.tan(fovRadians / 2);
    
    // Calculate current sphere screen percentage for debugging
    const screenHeight = 2 * Math.tan(fovRadians / 2) * this.distance;
    const currentScreenPercentage = (sphereSize / screenHeight) * 100;
    
    if (window.debugLog && currentScreenPercentage > maxScreenPercentage) {
      window.debugLog(`Sphere screen percentage: ${currentScreenPercentage.toFixed(2)}%, Target: ${maxScreenPercentage}%`, 'info');
    }
    
    // Apply zoom rate multiplier and scale with playable area
    const playableAreaScale = Math.max(1, window.GAME_CONFIG.PLAYABLE_AREA / 400);
    this.distance = baseDistance * zoomRate * playableAreaScale;
    
    // Scale height proportionally to distance
    // We'll use a height-to-distance ratio based on the existing thresholds
    const heightRatio = 0.5; // A good default height is about half the distance
    this.height = this.distance * heightRatio;
    
    // Update FOV based on sphere size
    const baseFOV = 75;
    const targetFOV = baseFOV - 5 + (sphereSize * 0.2); 
    
    // Clamp FOV between 60 and 100
    this.camera.fov = Math.max(60, Math.min(100, targetFOV));
    this.camera.updateProjectionMatrix();
    
    // Update camera position
    this.updateCameraPosition();
  }
}