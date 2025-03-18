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
    
    // Array to store barrier objects (mountains) that block movement
    const barrierCollisions = [];

    // Create bounding sphere for player
    const playerPosition = playerSphere.position.clone();
    const playerRadius = playerSize;

    // Check each object for collision
    objects.forEach(object => {
      // Skip objects marked as barriers - they're handled separately
      if (object.userData.isBarrier) {
        // Check if player is colliding with a barrier (mountain)
        if (this.checkBarrierCollision(playerSphere, object, playerRadius)) {
          barrierCollisions.push(object);
        }
        return;
      }
      
      // Calculate distance between centers
      const objectPosition = object.position.clone();
      const distance = playerPosition.distanceTo(objectPosition);

      // Use the pre-calculated collision radius for better consistency
      const objectRadius = object.userData.collisionRadius || object.userData.size;

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
    
    // Handle barrier collisions (mountains)
    if (barrierCollisions.length > 0) {
      this.handleBarrierCollisions(playerSphere, barrierCollisions);
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

  // Updated method to handle physics for collision with larger objects
  // Objects remain static, only the player is affected
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

        // Calculate push force with improved scaling for more consistent feel
        const sizeFactor = Math.min(object.userData.size / playerRadius, 10);
        
        // Use a stronger push force to ensure player cannot pass through larger objects
        const pushForceFactor = 0.2 + (Math.log(sizeFactor + 1) * 0.1);
        
        // Scale force by overlap amount for more realistic collision response
        const pushForce = overlap * pushForceFactor;

        // Apply force to player velocity
        playerSphere.userData.velocity.x += pushDirection.x * pushForce;
        playerSphere.userData.velocity.z += pushDirection.z * pushForce;
        
        // Immediate position correction to prevent clipping through objects
        // This helps ensure the player doesn't pass through objects
        const positionCorrection = Math.min(overlap * 0.5, 0.2); // Limit correction to avoid jumps
        playerSphere.position.x += pushDirection.x * positionCorrection;
        playerSphere.position.z += pushDirection.z * positionCorrection;
        
        // Add a small upward force when hitting larger objects at high speed
        // This creates a more dynamic feel to the collision
        const speed = new THREE.Vector3(
          playerSphere.userData.velocity.x,
          0,
          playerSphere.userData.velocity.z
        ).length();
        
        if (speed > 5 && sizeFactor > 2) {
          // Add a small bounce effect for high-speed collisions with large objects
          playerSphere.userData.velocity.y += speed * 0.05;
        }
      }
    });
  }
  
  /**
   * Check if the player is colliding with a barrier (mountain)
   * Uses box collision for more reliable boundary enforcement
   */
  checkBarrierCollision(playerSphere, barrier, playerRadius) {
    // Create a bounding box for the barrier if it doesn't exist
    if (!barrier.geometry.boundingBox) {
      barrier.geometry.computeBoundingBox();
    }
    
    // Get barrier's bounding box in world space
    const barrierBox = barrier.geometry.boundingBox.clone();
    barrierBox.applyMatrix4(barrier.matrixWorld);
    
    // Check if sphere intersects box using precise sphere vs. oriented box check
    const playerPos = playerSphere.position.clone();
    
    // Transform player position to barrier's local space
    const inverseMatrix = new THREE.Matrix4().copy(barrier.matrixWorld).invert();
    const localPlayerPos = playerPos.clone().applyMatrix4(inverseMatrix);
    
    // Get the box dimensions from the geometry
    const boxHalfWidth = barrier.geometry.parameters.width / 2;
    const boxHalfHeight = barrier.geometry.parameters.height / 2;
    const boxHalfDepth = barrier.geometry.parameters.depth / 2;
    
    // Find closest point on box to sphere center (in local space)
    const closestPoint = new THREE.Vector3(
      Math.max(-boxHalfWidth, Math.min(boxHalfWidth, localPlayerPos.x)),
      Math.max(-boxHalfHeight, Math.min(boxHalfHeight, localPlayerPos.y)),
      Math.max(-boxHalfDepth, Math.min(boxHalfDepth, localPlayerPos.z))
    );
    
    // Convert closest point back to world space
    const worldClosestPoint = closestPoint.clone().applyMatrix4(barrier.matrixWorld);
    
    // Calculate distance from closest point to sphere center
    const distance = playerPos.distanceTo(worldClosestPoint);
    
    // Collision occurs if distance is less than sphere radius
    return distance < playerRadius;
  }
  
  /**
   * Handle collisions with barriers (mountains)
   * Ensures player cannot pass through the mountain boundaries
   */
  handleBarrierCollisions(playerSphere, barriers) {
    const playerPos = playerSphere.position.clone();
    const velocity = playerSphere.userData.velocity;
    const playerRadius = playerSphere.geometry.parameters.radius;
    
    barriers.forEach(barrier => {
      if (!barrier.geometry.boundingBox) {
        barrier.geometry.computeBoundingBox();
      }
      
      // Transform player position to barrier's local space for more accurate collision
      const inverseMatrix = new THREE.Matrix4().copy(barrier.matrixWorld).invert();
      const localPlayerPos = playerPos.clone().applyMatrix4(inverseMatrix);
      
      // Get the box dimensions from the geometry
      const boxHalfWidth = barrier.geometry.parameters.width / 2;
      const boxHalfHeight = barrier.geometry.parameters.height / 2;
      const boxHalfDepth = barrier.geometry.parameters.depth / 2;
      
      // Find closest point on box to sphere center (in local space)
      const closestPoint = new THREE.Vector3(
        Math.max(-boxHalfWidth, Math.min(boxHalfWidth, localPlayerPos.x)),
        Math.max(-boxHalfHeight, Math.min(boxHalfHeight, localPlayerPos.y)),
        Math.max(-boxHalfDepth, Math.min(boxHalfDepth, localPlayerPos.z))
      );
      
      // Convert closest point back to world space
      const worldClosestPoint = closestPoint.clone().applyMatrix4(barrier.matrixWorld);
      
      // Calculate collision normal (direction from closest point to sphere center)
      const collisionNormal = new THREE.Vector3().subVectors(playerPos, worldClosestPoint).normalize();
      
      // Calculate penetration depth
      const penetrationDepth = playerRadius - playerPos.distanceTo(worldClosestPoint);
      
      // Only respond if there's actual penetration
      if (penetrationDepth > 0) {
        // Apply position correction based on penetration depth
        // Move the player out along the collision normal
        playerSphere.position.x += collisionNormal.x * (penetrationDepth * 1.01); // Slight extra push to avoid sticking
        playerSphere.position.z += collisionNormal.z * (penetrationDepth * 1.01);
        
        // Calculate reflection of velocity vector
        const currentVelocity = new THREE.Vector3(velocity.x, 0, velocity.z);
        const dot = currentVelocity.dot(collisionNormal);
        
        // Only reflect if moving toward the barrier
        if (dot < 0) {
          // Reflection formula: v' = v - 2(v·n)n
          const reflectedVelocity = new THREE.Vector3();
          reflectedVelocity.copy(currentVelocity).sub(
            collisionNormal.clone().multiplyScalar(2 * dot)
          );
          
          // Apply reflected velocity with some energy loss (bounce dampening)
          velocity.x = reflectedVelocity.x * 0.7; // 30% energy loss on bounce
          velocity.z = reflectedVelocity.z * 0.7;
        }
      }
    });
  }
}