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

    // Array to store larger objects that can't be absorbed but cause collision
    const largerCollisions = [];

    // Create bounding sphere for player
    const playerPosition = playerSphere.position.clone();
    const playerRadius = playerSize;

    // Check each object for collision
    objects.forEach(object => {
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
        // If object is smaller than player, add to absorbable collisions
        if (object.userData.size < playerSize) {
          collisions.push(object);
        }
        // If object is equal or larger than player, add to larger collisions
        else {
          largerCollisions.push({
            object: object,
            distance: distance,
            objectRadius: objectRadius,
            objectPosition: objectPosition
          });
        }
      }
    });

    // Handle physics for larger objects
    if (largerCollisions.length > 0) {
      this.handleLargerObjectCollisions(playerSphere, largerCollisions, playerRadius);
    }

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

  // New method to handle physics for collision with larger objects
  handleLargerObjectCollisions(playerSphere, largerCollisions, playerRadius) {
    // Calculate push direction and force based on object size and distance
    largerCollisions.forEach(collision => {
      const object = collision.object;
      const objectPosition = collision.objectPosition;
      const distance = collision.distance;
      const objectRadius = collision.objectRadius;

      // Calculate overlap
      const overlap = (playerRadius + objectRadius) - distance;

      // Only push if there's actual overlap
      if (overlap > 0) {
        // Calculate push direction (away from obstacle)
        const pushDirection = new THREE.Vector3()
          .subVectors(playerSphere.position, objectPosition)
          .normalize();

        // Calculate push force (larger objects push more, but with a cap)
        // Use logarithmic scaling for very large objects to prevent instant pushbacks
        const sizeFactor = Math.min(object.userData.size / playerRadius, 10);
        const pushForceFactor = Math.log(sizeFactor + 1) * 0.05;
        const pushForce = overlap * pushForceFactor;

        // Apply force to player velocity
        playerSphere.userData.velocity.x += pushDirection.x * pushForce;
        playerSphere.userData.velocity.z += pushDirection.z * pushForce;
        
        // Move larger objects when hit by player
        // The ability to move larger objects depends on player size
        // Calculate a size ratio to determine if/how much the larger object should move
        const sizeRatio = playerRadius / object.userData.size;
        
        // Only move the object if player is at least 20% of the object's size
        // This makes it possible to move even very large objects
        if (sizeRatio >= 0.2) {
          // Initialize velocity property for the object if it doesn't exist
          if (!object.userData.velocity) {
            object.userData.velocity = new THREE.Vector3();
          }
          
          // Calculate force to apply to the larger object
          // Use a logarithmic scale for better gameplay with huge objects
          const impactFactor = Math.log10(sizeRatio * 10 + 1) * 0.05;
          const objectPushForce = overlap * impactFactor;
          
          // Get player velocity magnitude for additional force
          const playerSpeed = new THREE.Vector3(
            playerSphere.userData.velocity.x,
            0,
            playerSphere.userData.velocity.z
          ).length();
          
          // Apply force to object in the opposite direction (from player to object)
          const reverseDirection = pushDirection.clone().negate();
          
          // Apply force to object velocity
          object.userData.velocity.x += reverseDirection.x * objectPushForce * playerSpeed;
          object.userData.velocity.z += reverseDirection.z * objectPushForce * playerSpeed;
          
          // Dampen the object's velocity (friction)
          object.userData.velocity.multiplyScalar(0.85);
        }
      }
    });
  }
}