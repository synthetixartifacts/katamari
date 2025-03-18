// Object Manager - Handles creation and management of collectible objects

class ObjectManager {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.maxObjects = 50; // Cap total number of objects for performance
    
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
        sizeRange: [0.5, 2],
        minPlayerSize: 0,
        maxPlayerSize: 10
      },
      {
        id: 'smallSphere',
        geometryType: 'sphere',
        sizeRange: [0.5, 2],
        minPlayerSize: 0,
        maxPlayerSize: 15
      },
      {
        id: 'mediumCube',
        geometryType: 'box',
        sizeRange: [2, 4],
        minPlayerSize: 5,
        maxPlayerSize: 20
      },
      {
        id: 'mediumSphere',
        geometryType: 'sphere',
        sizeRange: [2, 4],
        minPlayerSize: 5,
        maxPlayerSize: 20
      },
      {
        id: 'cone',
        geometryType: 'cone',
        sizeRange: [1, 3],
        minPlayerSize: 3,
        maxPlayerSize: 20
      },
      {
        id: 'cylinder',
        geometryType: 'cylinder',
        sizeRange: [1, 3],
        minPlayerSize: 3,
        maxPlayerSize: 20
      },
      {
        id: 'largeCube',
        geometryType: 'box',
        sizeRange: [4, 8],
        minPlayerSize: 10,
        maxPlayerSize: 30
      },
      {
        id: 'largeSphere',
        geometryType: 'sphere',
        sizeRange: [4, 8],
        minPlayerSize: 10,
        maxPlayerSize: 30
      },
      {
        id: 'hugeCube',
        geometryType: 'box',
        sizeRange: [8, 15],
        minPlayerSize: 20,
        maxPlayerSize: Infinity
      },
      {
        id: 'hugeSphere',
        geometryType: 'sphere',
        sizeRange: [8, 15],
        minPlayerSize: 20,
        maxPlayerSize: Infinity
      }
    ];
  }
  
  spawnInitialObjects(playerSize) {
    // Spawn initial set of objects
    const count = 30; // Start with 30 objects
    
    for (let i = 0; i < count; i++) {
      this.spawnRandomObject(playerSize);
    }
  }
  
  spawnRandomObject(playerSize) {
    // Ensure we're not over the object limit
    if (this.objects.length >= this.maxObjects) {
      return null;
    }
    
    // Filter object definitions based on player's current size
    const availableObjects = this.objectDefinitions.filter(def => 
      playerSize >= def.minPlayerSize && playerSize <= def.maxPlayerSize
    );
    
    // If no objects match this size range, return
    if (availableObjects.length === 0) {
      return null;
    }
    
    // Select a random object definition
    const objectDef = availableObjects[Math.floor(Math.random() * availableObjects.length)];
    
    // Choose random size within range
    const size = randomInRange(objectDef.sizeRange[0], objectDef.sizeRange[1]);
    
    // Choose random position within reasonable bounds
    // (Adjusted based on player size to ensure objects aren't too far away)
    const spawnRadius = 50 + playerSize * 2;
    const position = {
      x: randomInRange(-spawnRadius, spawnRadius),
      y: size / 2, // Half the height to place on ground
      z: randomInRange(-spawnRadius, spawnRadius)
    };
    
    // Choose random color from palette
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    
    // Create the object
    const object = this._createObject(objectDef.geometryType, size, position, color);
    
    // Add to scene and tracking array
    this.scene.add(object);
    this.objects.push(object);
    
    return object;
  }
  
  _createObject(type, size, position, color) {
    let geometry, mesh;
    
    switch (type) {
      case 'box':
        geometry = new THREE.BoxGeometry(size, size, size);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(size, 16, 16);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(size, size * 2, 16);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(size, size, size * 2, 16);
        break;
      default:
        geometry = new THREE.SphereGeometry(size, 16, 16);
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.2
    });
    
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
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
    // Determine how many objects we want based on player size
    const desiredObjectCount = Math.min(30 + Math.floor(playerSize * 2), this.maxObjects);
    
    // Spawn additional objects if needed
    const objectsToSpawn = desiredObjectCount - this.objects.length;
    
    for (let i = 0; i < objectsToSpawn; i++) {
      this.spawnRandomObject(playerSize);
    }
    
    // Cull objects that are too small to be relevant anymore
    this._cullTinyObjects(playerSize);
  }
  
  _cullTinyObjects(playerSize) {
    // Remove objects that are now too small to be interesting
    // (e.g., if they're less than 10% of player's size and far away)
    const minRelevantSize = playerSize * 0.1;
    
    // Use an array to collect objects to remove
    const objectsToRemove = [];
    
    this.objects.forEach(object => {
      if (object.userData.size < minRelevantSize) {
        // Calculate distance to player (simplified as playerSphere might be at 0,0,0)
        const distanceSq = object.position.lengthSq();
        
        // If small and far away, mark for removal
        if (distanceSq > 2500) { // 50 units squared
          objectsToRemove.push(object);
        }
      }
    });
    
    // Remove all collected objects
    objectsToRemove.forEach(object => this.removeObject(object));
  }
}