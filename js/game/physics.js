// Physics - Handles collision detection and physics calculations

class Physics {
  constructor() {
    // Gravity constant
    this.gravity = 9.8;
    
    // Ground friction
    this.friction = 0.95;
  }
  
  checkCollisions(playerSphere, objects, playerSize) {
    // Array to store objects that should be absorbed
    const collisions = [];
    
    // Create bounding sphere for player
    const playerPosition = playerSphere.position.clone();
    const playerRadius = playerSize;
    
    // Check each object for collision
    objects.forEach(object => {
      // Skip objects larger than player
      if (object.userData.size >= playerSize) {
        return;
      }
      
      // Calculate distance between centers
      const objectPosition = object.position.clone();
      const distance = playerPosition.distanceTo(objectPosition);
      
      // For sphere objects, use their radius
      let objectRadius = object.userData.size;
      
      // Adjust the effective radius based on object type for better collision feel
      if (object.userData.type === 'box') {
        // For boxes, use half the size as radius (approximation)
        objectRadius = object.userData.size * 0.5;
      } else if (object.userData.type === 'cone') {
        // For cones, use the base radius
        objectRadius = object.userData.size * 0.5;
      } else if (object.userData.type === 'cylinder') {
        // For cylinders, use the radius
        objectRadius = object.userData.size * 0.5;
      }
      
      // Check if collision occurs (spheres overlap)
      if (distance < playerRadius + objectRadius) {
        collisions.push(object);
      }
    });
    
    return collisions;
  }
  
  applyPhysics(playerSphere, delta) {
    // Get current velocity
    const velocity = playerSphere.userData.velocity;
    
    // Apply gravity if the sphere is above ground
    if (playerSphere.position.y > playerSphere.geometry.parameters.radius) {
      velocity.y -= this.gravity * delta;
    } else {
      // On ground, set Y position and zero Y velocity
      playerSphere.position.y = playerSphere.geometry.parameters.radius;
      velocity.y = 0;
      
      // Apply friction on ground
      velocity.x *= this.friction;
      velocity.z *= this.friction;
    }
    
    // Apply velocity to position
    playerSphere.position.x += velocity.x * delta;
    playerSphere.position.y += velocity.y * delta;
    playerSphere.position.z += velocity.z * delta;
    
    // Simple sphere rotation based on movement
    if (Math.abs(velocity.x) > 0.01 || Math.abs(velocity.z) > 0.01) {
      const radius = playerSphere.geometry.parameters.radius;
      
      // Calculate rotation based on movement and radius
      playerSphere.rotation.x += velocity.z * delta / radius;
      playerSphere.rotation.z -= velocity.x * delta / radius;
    }
  }
}