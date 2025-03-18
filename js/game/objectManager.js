// Object Manager - Handles creation and management of collectible objects

class ObjectManager {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];

    // Rainbow colors palette
    this.colors = [
      0xFF0000, // Red
      0xFFA500, // Orange
      0xFFFF00, // Yellow
      0x008000, // Green
      0x0000FF, // Blue
      0x4B0082, // Indigo
      0xEE82EE  // Violet
    ];

    // Object definitions
    this.objectDefinitions = [
      {
        id: 'smallCube',
        geometryType: 'box',
        sizeRange: [0.5, 10]
      },
      {
        id: 'smallSphere',
        geometryType: 'sphere',
        sizeRange: [0.5, 15]
      },
      {
        id: 'mediumCube',
        geometryType: 'box',
        sizeRange: [5, 25]
      },
      {
        id: 'mediumSphere',
        geometryType: 'sphere',
        sizeRange: [5, 30]
      },
      {
        id: 'cone',
        geometryType: 'cone',
        sizeRange: [3, 20]
      },
      {
        id: 'cylinder',
        geometryType: 'cylinder',
        sizeRange: [3, 25]
      },
      {
        id: 'largeCube',
        geometryType: 'box',
        sizeRange: [10, 50]
      },
      {
        id: 'largeSphere',
        geometryType: 'sphere',
        sizeRange: [10, 60]
      },
      {
        id: 'hugeCube',
        geometryType: 'box',
        sizeRange: [30, window.GAME_CONFIG.MAX_OBJECT_SIZE / 2]
      },
      {
        id: 'hugeSphere',
        geometryType: 'sphere',
        sizeRange: [30, window.GAME_CONFIG.MAX_OBJECT_SIZE]
      }
    ];
  }

  spawnInitialObjects(playerSize) {
    // Spawn initial set of objects
    const count = window.GAME_CONFIG.INITIAL_OBJECTS_COUNT; // Use global config
    
    // Add retry mechanism to prevent infinite loops in crowded scenes
    const maxSpawnAttempts = count * 2; // Allow up to 2x attempts
    let successfulSpawns = 0;
    let totalAttempts = 0;

    console.log(`Attempting to spawn ${count} initial objects...`);
    
    while (successfulSpawns < count && totalAttempts < maxSpawnAttempts) {
      const newObject = this.spawnRandomObject(playerSize);
      totalAttempts++;
      
      if (newObject) {
        successfulSpawns++;
        
        // Log progress every 100 objects
        if (successfulSpawns % 100 === 0) {
          console.log(`Spawned ${successfulSpawns}/${count} objects...`);
        }
      }
      
      // If we're having trouble spawning objects after many attempts,
      // bail out early to prevent long loading times
      if (totalAttempts >= 100 && successfulSpawns < totalAttempts * 0.1) {
        console.log(`Stopping initial spawn after ${successfulSpawns}/${count} objects due to difficulty placing more`);
        break;
      }
    }
    
    console.log(`Successfully spawned ${successfulSpawns}/${count} initial objects after ${totalAttempts} attempts`);
  }

  spawnRandomObject(playerSize) {
    // Ensure we're not over the object limit
    if (this.objects.length >= window.GAME_CONFIG.MAX_OBJECTS_COUNT) {
      return null;
    }

    // Group objects by size category
    const smallObjects = this.objectDefinitions.filter(obj => 
      obj.sizeRange[1] <= 15 && obj.id.includes('small')
    );
    
    const mediumObjects = this.objectDefinitions.filter(obj => 
      (obj.sizeRange[1] > 15 && obj.sizeRange[1] <= 30) || 
      (obj.id.includes('medium') || obj.id === 'cone' || obj.id === 'cylinder')
    );
    
    const largeObjects = this.objectDefinitions.filter(obj => 
      obj.sizeRange[1] > 30 || obj.id.includes('large') || obj.id.includes('huge')
    );

    // Set probability weights (60% small, 30% medium, 10% large)
    let objectDef;
    const randomValue = Math.random();
    
    if (randomValue < 0.6) {
      // Pick a small object
      objectDef = smallObjects[Math.floor(Math.random() * smallObjects.length)];
    } else if (randomValue < 0.9) {
      // Pick a medium object
      objectDef = mediumObjects[Math.floor(Math.random() * mediumObjects.length)];
    } else {
      // Pick a large object
      objectDef = largeObjects[Math.floor(Math.random() * largeObjects.length)];
    }
    
    // Fallback if the selected category is empty
    if (!objectDef) {
      objectDef = this.objectDefinitions[Math.floor(Math.random() * this.objectDefinitions.length)];
    }

    // Choose random size within range - capped by MAX_OBJECT_SIZE
    // For small objects, bias toward the lower end of the range
    const minSize = objectDef.sizeRange[0];
    const maxSize = Math.min(objectDef.sizeRange[1], window.GAME_CONFIG.MAX_OBJECT_SIZE);
    
    // For small objects, use a square root distribution to favor smaller sizes
    let size;
    if (smallObjects.includes(objectDef)) {
      // Square root distribution favors smaller values
      const randomFactor = Math.sqrt(Math.random());
      size = minSize + randomFactor * (maxSize - minSize);
    } else {
      // Regular uniform distribution for medium and large objects
      size = randomInRange(minSize, maxSize);
    }

    // Calculate valid position that doesn't overlap with other objects
    const position = this._findNonOverlappingPosition(size, objectDef.geometryType, playerSize);
    if (!position) {
      // If we couldn't find a valid position after max attempts, don't spawn the object
      return null;
    }

    // Choose random color from palette
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];

    // Create the object
    const object = this._createObject(objectDef.geometryType, size, position, color);

    // Add to scene and tracking array
    this.scene.add(object);
    this.objects.push(object);

    return object;
  }

  /**
   * Find a position for a new object that doesn't overlap with existing objects
   * @param {number} size - Size of the object to place
   * @param {string} geometryType - Type of geometry ('box', 'sphere', etc.)
   * @param {number} playerSize - Current size of the player
   * @returns {Object|null} - Valid position {x,y,z} or null if no valid position found
   */
  _findNonOverlappingPosition(size, geometryType, playerSize) {
    const MAX_ATTEMPTS = 50; // Maximum number of attempts to find non-overlapping position
    const playableArea = window.GAME_CONFIG.PLAYABLE_AREA;
    const maxCoord = Math.min(playableArea, window.GAME_CONFIG.MAP_SIZE / 2 - size);
    
    // Determine effective radius for collision checks based on geometry type
    let effectiveRadius = size;
    if (geometryType === 'box') {
      effectiveRadius = size * 0.7; // Approximate box "radius"
    } else if (geometryType === 'cone' || geometryType === 'cylinder') {
      effectiveRadius = size * 0.5; // Base radius
    }
    
    // Get player position
    let playerPosition = null;
    if (this.scene.getObjectByName('playerSphere')) {
      playerPosition = this.scene.getObjectByName('playerSphere').position.clone();
    }
    
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Generate random position
      const position = {
        x: randomInRange(-maxCoord, maxCoord),
        y: 0, // Will be adjusted in _createObject
        z: randomInRange(-maxCoord, maxCoord)
      };
      
      // Check distance from player (avoid spawning too close to player)
      if (playerPosition) {
        const distToPlayer = Math.sqrt(
          Math.pow(position.x - playerPosition.x, 2) + 
          Math.pow(position.z - playerPosition.z, 2)
        );
        
        // Don't spawn too close to player (minimum distance = player size + object size + buffer)
        const minPlayerDist = playerSize + effectiveRadius + 5;
        if (distToPlayer < minPlayerDist) {
          continue; // Too close to player, try again
        }
      }
      
      // Check for overlap with existing objects
      let hasOverlap = false;
      
      for (const object of this.objects) {
        // Get object position and effective radius
        const objPos = object.position;
        let objRadius = object.userData.size;
        
        // Adjust radius based on object type for better collision calculation
        if (object.userData.type === 'box') {
          objRadius *= 0.7; // Approximate for box
        } else if (object.userData.type === 'cone' || object.userData.type === 'cylinder') {
          objRadius *= 0.5; // Base radius
        }
        
        // Calculate distance between centers
        const distance = Math.sqrt(
          Math.pow(position.x - objPos.x, 2) + 
          Math.pow(position.z - objPos.z, 2)
        );
        
        // Check if objects would overlap
        // Add small buffer (0.5) to prevent objects from being too close
        if (distance < (effectiveRadius + objRadius + 0.5)) {
          hasOverlap = true;
          break;
        }
      }
      
      // If no overlap found, return this position
      if (!hasOverlap) {
        return position;
      }
    }
    
    // If we've reached here, we couldn't find a valid position after MAX_ATTEMPTS
    return null;
  }

  _createObject(type, size, position, color) {
    let geometry, mesh;
    // Account for ground position at y = -0.5
    const groundLevel = -0.5;
    
    // Y offset will be calculated based on geometry type
    let yOffset = 0;

    switch (type) {
      case 'box':
        geometry = new THREE.BoxGeometry(size, size, size);
        // For a box, the bottom is at -size/2 from center
        yOffset = size / 2;
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(size, 16, 16);
        // For a sphere, the bottom is at -radius from center
        yOffset = size;
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(size, size * 2, 16);
        // For a cone, the bottom is at -height/2 from center
        yOffset = size; // half of size*2
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(size, size, size * 2, 16);
        // For a cylinder, the bottom is at -height/2 from center
        yOffset = size; // half of size*2
        break;
      default:
        geometry = new THREE.SphereGeometry(size, 16, 16);
        yOffset = size;
    }

    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.2
    });

    mesh = new THREE.Mesh(geometry, material);
    
    // Position y is groundLevel + yOffset to place object on the ground
    mesh.position.set(position.x, groundLevel + yOffset, position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Add metadata to the mesh for collision detection
    mesh.userData = {
      type: type,
      size: size,
      canBeAbsorbed: true
    };

    return mesh;
  }

  removeObject(object) {
    // Remove from scene
    this.scene.remove(object);

    // Remove from tracking array
    const index = this.objects.indexOf(object);
    if (index !== -1) {
      this.objects.splice(index, 1);
    }
  }

  checkAndSpawnObjects(playerSize) {
    // Only respawn objects if the configuration allows it
    if (!window.GAME_CONFIG.RESPAWN_OBJECTS) {
      return;
    }
    
    // Determine how many objects we want - independent of player size
    const desiredObjectCount = Math.min(window.GAME_CONFIG.MAX_OBJECTS_COUNT, window.GAME_CONFIG.INITIAL_OBJECTS_COUNT);

    // Spawn additional objects if needed
    const objectsToSpawn = desiredObjectCount - this.objects.length;
    
    // Add retry mechanism - with max attempts to prevent infinite loops in crowded scenes
    const maxSpawnAttempts = objectsToSpawn * 2; // Allow up to 2x attempts
    let successfulSpawns = 0;
    let totalAttempts = 0;
    
    while (successfulSpawns < objectsToSpawn && totalAttempts < maxSpawnAttempts) {
      const newObject = this.spawnRandomObject(playerSize);
      totalAttempts++;
      
      if (newObject) {
        successfulSpawns++;
      }
      
      // If we're having trouble spawning objects (scene may be too crowded),
      // bail out early to prevent performance issues
      if (totalAttempts >= 10 && successfulSpawns === 0) {
        console.log("Unable to spawn new objects - scene may be too crowded");
        break;
      }
    }

    // Cull objects that are too small to be relevant anymore
    this._cullTinyObjects(playerSize);
  }

  _cullTinyObjects(playerSize) {
    // Only remove small objects that are far away
    const minRelevantSize = playerSize * 0.1;

    // Use an array to collect objects to remove
    const objectsToRemove = [];
    
    // Calculate distance threshold based on playable area
    const playableArea = window.GAME_CONFIG.PLAYABLE_AREA;
    const cullDistanceThreshold = playableArea * playableArea; // Square it for distanceSq comparison

    this.objects.forEach(object => {
      // Only cull if object is small relative to player size
      // Leave large objects alone even if they're far away
      if (object.userData.size < minRelevantSize && object.userData.size < 5) {
        // Calculate distance to player (simplified as playerSphere might be at 0,0,0)
        const distanceSq = object.position.lengthSq();

        // If small and far away, mark for removal
        if (distanceSq > cullDistanceThreshold) {
          objectsToRemove.push(object);
        }
      }
    });

    // Remove all collected objects
    objectsToRemove.forEach(object => this.removeObject(object));
  }
}