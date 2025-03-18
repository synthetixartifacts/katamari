// Camera Controller - Manages camera position and follows player

class CameraController {
  constructor(initialSphereSize) {
    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );

    // Camera fixed position parameters
    this.distance = 20;
    this.height = 10;
    this.rotationAngle = 0; // Camera rotation angle in radians
    
    // Size thresholds for camera adjustments
    this.sizeThresholds = [
      { size: 5, distance: 25, height: 12 },
      { size: 10, distance: 35, height: 15 },
      { size: 20, distance: 50, height: 25 },
      { size: 40, distance: 70, height: 40 }
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
    
    // Find appropriate camera settings based on sphere size
    let settings = {
      distance: 20,
      height: 10
    };

    // Check thresholds
    if (this.sizeThresholds && this.sizeThresholds.length > 0) {
      // Check thresholds in reverse order (largest first)
      for (let i = this.sizeThresholds.length - 1; i >= 0; i--) {
        const threshold = this.sizeThresholds[i];
        if (sphereSize >= threshold.size) {
          settings = threshold;
          break;
        }
      }
    }

    // Update camera parameters
    this.distance = settings.distance;
    this.height = settings.height;
    
    // Update FOV based on sphere size
    const baseFOV = 75;
    const targetFOV = baseFOV - 5 + (sphereSize * 0.5); 
    
    // Clamp FOV between 60 and 100
    this.camera.fov = Math.max(60, Math.min(100, targetFOV));
    this.camera.updateProjectionMatrix();
    
    // Update camera position
    this.updateCameraPosition();
  }
}