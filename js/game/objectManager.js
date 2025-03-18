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

    for (let i = 0; i < count; i++) {
      this.spawnRandomObject(playerSize);
    }
  }

  spawnRandomObject(playerSize) {
    // Ensure we're not over the object limit
    if (this.objects.length >= window.GAME_CONFIG.MAX_OBJECTS_COUNT) {
      return null;
    }

    // Select a random object definition regardless of player size
    const objectDef = this.objectDefinitions[Math.floor(Math.random() * this.objectDefinitions.length)];

    // Choose random size within range - capped by MAX_OBJECT_SIZE
    const minSize = objectDef.sizeRange[0];
    const maxSize = Math.min(objectDef.sizeRange[1], window.GAME_CONFIG.MAX_OBJECT_SIZE);
    const size = randomInRange(minSize, maxSize);

    // Choose random position within the playable area
    const playableArea = window.GAME_CONFIG.PLAYABLE_AREA;
    
    // Ensure objects are spawned within the map boundaries
    const maxCoord = Math.min(playableArea, window.GAME_CONFIG.MAP_SIZE / 2 - size);
    
    const position = {
      x: randomInRange(-maxCoord, maxCoord),
      y: size / 2, // Half the height to place on ground
      z: randomInRange(-maxCoord, maxCoord)
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
    // Only respawn objects if the configuration allows it
    if (!window.GAME_CONFIG.RESPAWN_OBJECTS) {
      return;
    }
    
    // Determine how many objects we want - independent of player size
    const desiredObjectCount = Math.min(window.GAME_CONFIG.MAX_OBJECTS_COUNT, window.GAME_CONFIG.INITIAL_OBJECTS_COUNT);

    // Spawn additional objects if needed
    const objectsToSpawn = desiredObjectCount - this.objects.length;

    for (let i = 0; i < objectsToSpawn; i++) {
      this.spawnRandomObject(playerSize);
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