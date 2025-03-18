/**
 * SceneDecor - Manages decorative elements in the 3D game scene
 * This class handles background elements that enhance the visual experience
 * including sky elements (sun, clouds, rainbow) and landscape features (mountains)
 */
class SceneDecor {
  constructor(scene) {
    this.scene = scene;
    this.decorElements = {
      clouds: [],
      mountains: [],
      sun: null,
      rainbow: null,
      sky: null,
    };

    // Configuration
    this.config = {
      cloudsCount: 45,
      cloudSpawnRate: 15000, // ms between cloud spawns
      cloudSpeed: 0.01,
      mountainCount: 24, // Increased from 10 to 24 for full border coverage
      skyDomeRadius: 5000, // Large sky dome to encompass entire scene
    };

    // Track timing for cloud spawning
    this.lastCloudSpawn = 0;

    // Debug info
    console.log("SceneDecor: Initializing decorative elements");

    // Initialize all decorative elements
    this._initialize();
  }

  /**
   * Initialize all decorative elements in the scene
   */
  _initialize() {
    this._createSkyDome();
    this._createSun();
    this._createMountains();
    this._createRainbow();
    this._createInitialClouds();
    console.log("SceneDecor: All decorative elements initialized");
  }

  /**
   * Creates a sky dome to serve as the background
   */
  _createSkyDome() {
    console.log("SceneDecor: Creating sky dome");
    const skyGeometry = new THREE.SphereGeometry(
      this.config.skyDomeRadius,
      32,
      32
    );
    // Inside face of the sphere
    skyGeometry.scale(-1, 1, 1);

    // Create a bright blue sky material
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x4fb6f2, // Brighter blue color
      side: THREE.BackSide,
      fog: false, // Ensure fog doesn't affect the sky
    });

    this.decorElements.sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.decorElements.sky);

    // Force sky to render first
    this.decorElements.sky.renderOrder = -1000;

    // Explicitly set the scene background color as well for backup
    this.scene.background = new THREE.Color(0x4fb6f2);

    console.log("SceneDecor: Sky dome added to scene");
  }

  /**
   * Creates sun in the sky
   */
  _createSun() {
    console.log("SceneDecor: Creating sun");
    // Create a bright glowing sun - using a sphere instead of a circle
    const sunGeometry = new THREE.SphereGeometry(150, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 1,
    });

    this.decorElements.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.decorElements.sun.position.set(1000, 800, -1500);
    this.scene.add(this.decorElements.sun);

    // Add sun glow effect as a larger sphere
    const sunGlowGeometry = new THREE.SphereGeometry(220, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffa0,
      transparent: true,
      opacity: 0.4,
    });

    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sunGlow.position.copy(this.decorElements.sun.position);
    this.scene.add(sunGlow);
    console.log(
      "SceneDecor: Sun added to scene at position",
      this.decorElements.sun.position
    );
  }

  /**
   * Creates mountains in the background
   */
  _createMountains() {
    console.log("SceneDecor: Creating mountains");

    // Create mountain range with gradient base colors
    const mountainBaseColors = [
      0x8b4513, // Brown
      0x556b2f, // Dark olive green
      0x2f4f4f, // Dark slate gray
      0x808000, // Olive
      0x696969, // Dim gray
    ];

    // Snow color for mountain tops
    const snowColor = new THREE.Color(0xffffff);

    // Determine playable area border - use MAP_SIZE from GAME_CONFIG
    const playAreaRadius = window.GAME_CONFIG.MAP_SIZE / 2;
    const mountainBorderDistance = playAreaRadius; // Exactly at the border of the play area

    // Container for all mountains (for easier management)
    const mountainsGroup = new THREE.Group();
    this.scene.add(mountainsGroup);

    // Create mountain segments around the border
    const mountainSegments = 24; // Increased segment count for smoother border
    const segmentAngle = (Math.PI * 2) / mountainSegments;

    for (let i = 0; i < mountainSegments; i++) {
      // Base angle for this segment
      const segmentBaseAngle = i * segmentAngle;

      // Create rectangular base with uniform width for each segment
      const segmentArcLength = segmentAngle * 1.1; // Slight overlap to avoid gaps
      const segmentWidth = mountainBorderDistance * segmentArcLength;
      const segmentDepth = 20; // Fixed depth for consistent border barrier

      // More varied height - some mountains taller than others
      // Original maxHeight was 20, now we allow up to 35 for some mountains
      const mountainVariety = Math.random(); // 0-1 value to determine mountain type
      const maxHeight =
        mountainVariety > 0.7
          ? 25 + Math.random() * 10 // Taller mountains (25-35)
          : 15 + Math.random() * 10; // Regular mountains (15-25)

      // Create the rectangular base vertices
      const innerRadius = mountainBorderDistance - segmentDepth;
      const outerRadius = mountainBorderDistance; // Outer edge exactly at border

      // Number of peaks along the mountain range
      const peaksCount = 3 + Math.floor(Math.random() * 3);

      // Create vertices for the mountain
      const vertices = [];
      const indices = [];
      const colors = []; // Add vertex colors for gradient

      // Inner and outer points along the arc
      const innerPoints = [];
      const outerPoints = [];

      // Generate points along the arc for the base
      const arcSteps = 12; // Detail level of the curve
      for (let j = 0; j <= arcSteps; j++) {
        const pointAngle =
          segmentBaseAngle +
          (segmentArcLength * j) / arcSteps -
          segmentArcLength / 2;

        // Inner ring
        innerPoints.push(
          new THREE.Vector3(
            innerRadius * Math.sin(pointAngle),
            0, // At ground level
            innerRadius * Math.cos(pointAngle)
          )
        );

        // Outer ring
        outerPoints.push(
          new THREE.Vector3(
            outerRadius * Math.sin(pointAngle),
            0, // At ground level
            outerRadius * Math.cos(pointAngle)
          )
        );
      }

      // Create peaks along the mountain range with varied heights
      const peakPoints = [];
      for (let p = 0; p < peaksCount; p++) {
        const peakIndex = Math.floor((p / (peaksCount - 1)) * arcSteps);

        // More variance in peak heights within each segment
        let peakHeight;
        if (p === Math.floor(peaksCount / 2) && mountainVariety > 0.7) {
          // Make the middle peak of some segments significantly taller
          peakHeight = maxHeight * (0.9 + Math.random() * 0.1);
        } else {
          // Other peaks varied but not as tall
          peakHeight = 10 + Math.random() * (maxHeight * 0.8);
        }

        // Calculate position between inner and outer ring
        const peakBasePos = new THREE.Vector3().lerpVectors(
          innerPoints[peakIndex],
          outerPoints[peakIndex],
          0.5 + Math.random() * 0.5 // Position peaks toward outer edge
        );

        // Add height to the peak
        peakPoints.push(
          new THREE.Vector3(peakBasePos.x, peakHeight, peakBasePos.z)
        );
      }

      // Select base color for this mountain segment
      const baseColor = new THREE.Color(
        mountainBaseColors[i % mountainBaseColors.length]
      );
      // Slightly vary the base color for each mountain
      baseColor.r *= 0.9 + Math.random() * 0.2;
      baseColor.g *= 0.9 + Math.random() * 0.2;
      baseColor.b *= 0.9 + Math.random() * 0.2;

      // Generate all vertices - first add all base points
      for (let j = 0; j < innerPoints.length; j++) {
        // Inner base points
        vertices.push(innerPoints[j].x, innerPoints[j].y, innerPoints[j].z);
        // Add base color for lower vertices
        colors.push(baseColor.r, baseColor.g, baseColor.b);

        // Outer base points
        vertices.push(outerPoints[j].x, outerPoints[j].y, outerPoints[j].z);
        // Add base color for lower vertices
        colors.push(baseColor.r, baseColor.g, baseColor.b);
      }

      // Add peak vertices
      for (let p = 0; p < peakPoints.length; p++) {
        vertices.push(peakPoints[p].x, peakPoints[p].y, peakPoints[p].z);

        // Create gradient color based on peak height
        // Enhanced snow effect - more snow coverage on the tops
        const normalizedHeight = peakPoints[p].y / maxHeight;
        let peakColor = new THREE.Color();

        if (normalizedHeight > 0.5) {
          // Snow starts at 50% height instead of 75% (more snow coverage)
          // Use a non-linear curve for snow intensity to concentrate it at the top
          const snowAmount = Math.pow((normalizedHeight - 0.5) * 2, 1.5);

          // For very top peaks (top 10%), increase snow intensity further
          if (normalizedHeight > 0.9) {
            // Extra snow at the very top
            const extraSnow = (normalizedHeight - 0.9) * 5; // 0 to 0.5 extra
            peakColor
              .copy(baseColor)
              .lerp(snowColor, Math.min(1, snowAmount + extraSnow));
          } else {
            peakColor.copy(baseColor).lerp(snowColor, snowAmount);
          }
        } else {
          // Lower parts - keep the same coloring as before
          const middleColor = new THREE.Color(baseColor).multiplyScalar(
            1 + normalizedHeight * 0.5
          );
          peakColor.copy(baseColor).lerp(middleColor, normalizedHeight * 1.33);
        }

        colors.push(peakColor.r, peakColor.g, peakColor.b);
      }

      // Create faces - connect base to peaks
      const baseVertexCount = innerPoints.length * 2; // Total vertices in base

      // Create triangles for the sides
      for (let j = 0; j < arcSteps; j++) {
        // Indices for the two base vertices
        const innerIndex = j * 2;
        const outerIndex = j * 2 + 1;
        const nextInnerIndex = (j + 1) * 2;
        const nextOuterIndex = (j + 1) * 2 + 1;

        // Find the nearest peak for this segment
        let nearestPeak = 0;
        let shortestDistance = Infinity;

        for (let p = 0; p < peakPoints.length; p++) {
          const midpoint = new THREE.Vector3()
            .addVectors(
              new THREE.Vector3(
                vertices[innerIndex * 3],
                vertices[innerIndex * 3 + 1],
                vertices[innerIndex * 3 + 2]
              ),
              new THREE.Vector3(
                vertices[outerIndex * 3],
                vertices[outerIndex * 3 + 1],
                vertices[outerIndex * 3 + 2]
              )
            )
            .multiplyScalar(0.5);

          const distance = midpoint.distanceTo(peakPoints[p]);
          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestPeak = p;
          }
        }

        const peakIndex = baseVertexCount + nearestPeak;

        // Create triangles connecting to peak
        // Triangle 1: inner -> outer -> peak
        indices.push(innerIndex, outerIndex, peakIndex);

        // Triangle 2: outer -> nextOuter -> peak
        indices.push(outerIndex, nextOuterIndex, peakIndex);

        // Triangle 3: nextOuter -> nextInner -> peak
        indices.push(nextOuterIndex, nextInnerIndex, peakIndex);

        // Triangle 4: nextInner -> inner -> peak
        indices.push(nextInnerIndex, innerIndex, peakIndex);
      }

      // Create base triangles (bottom of mountain)
      for (let j = 0; j < arcSteps; j++) {
        const innerIndex = j * 2;
        const outerIndex = j * 2 + 1;
        const nextInnerIndex = (j + 1) * 2;
        const nextOuterIndex = (j + 1) * 2 + 1;

        // Triangle 1: inner -> outer -> nextInner
        indices.push(innerIndex, outerIndex, nextInnerIndex);

        // Triangle 2: outer -> nextOuter -> nextInner
        indices.push(outerIndex, nextOuterIndex, nextInnerIndex);
      }

      // Create the buffer geometry
      const mountainGeometry = new THREE.BufferGeometry();
      mountainGeometry.setIndex(indices);
      mountainGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );
      mountainGeometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3)
      );
      mountainGeometry.computeVertexNormals();

      // Create material with vertex colors for gradient and flat shading for rocky look
      const mountainMaterial = new THREE.MeshPhongMaterial({
        vertexColors: true,
        flatShading: true,
        side: THREE.DoubleSide,
        shininess: 5, // Lower shininess for more natural look
      });

      // Create the mountain mesh
      const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);

      // Add to mountain group
      mountainsGroup.add(mountain);
      this.decorElements.mountains.push(mountain);

      // Create collision box for the mountain segment (invisible barrier)
      // Align the barrier precisely with the mountain segment
      const segmentCenterAngle = segmentBaseAngle;
      const segmentCenterX =
        mountainBorderDistance * Math.sin(segmentCenterAngle);
      const segmentCenterZ =
        mountainBorderDistance * Math.cos(segmentCenterAngle);

      // Calculate barrier box dimensions to match the visual mountain exactly
      const boxWidth = segmentWidth;
      const boxHeight = maxHeight * 1.5; // Slightly taller than mountains to prevent jumping over
      const boxDepth = segmentDepth;

      // Create invisible barrier box
      const barrierGeometry = new THREE.BoxGeometry(
        boxWidth,
        boxHeight,
        boxDepth
      );
      const barrierMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.0, // Invisible in game, set to 0.2 for debugging
        color: 0xff0000,
      });

      const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);

      // Position the barrier at the center of the mountain segment
      // It needs to be properly aligned with the game's circular boundary
      barrier.position.set(
        (innerRadius + segmentDepth / 2) * Math.sin(segmentCenterAngle),
        boxHeight / 2, // Center height
        (innerRadius + segmentDepth / 2) * Math.cos(segmentCenterAngle)
      );

      // Rotate to face center of play area
      barrier.lookAt(0, barrier.position.y, 0);

      // Set userData for collision detection
      barrier.userData.isBarrier = true;

      // Add to scene for collision detection
      this.scene.add(barrier);
      this.decorElements.mountains.push(barrier);
    }

    console.log(
      `SceneDecor: ${this.decorElements.mountains.length} mountain elements added to scene`
    );
  }

  /**
   * Creates a rainbow in the sky
   */
  _createRainbow() {
    console.log("SceneDecor: Creating rainbow");
    // Create rainbow bands
    const rainbowColors = [
      0xff0000, // Red
      0xff7f00, // Orange
      0xffff00, // Yellow
      0x00ff00, // Green
      0x0000ff, // Blue
      0x4b0082, // Indigo
      0x9400d3, // Violet
    ];

    const rainbowGroup = new THREE.Group();
    const rainbowRadius = 400;
    const tubeRadius = 10;

    // Create a simpler rainbow using arcs
    for (let i = 0; i < rainbowColors.length; i++) {
      const bandRadius = rainbowRadius - i * tubeRadius * 2;
      const arc = new THREE.ArcCurve(
        0,
        0, // Center x, y
        bandRadius, // Radius
        0,
        Math.PI, // Start angle, end angle
        false // Counterclockwise
      );

      const points = arc.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      // Convert the 2D points to 3D
      const positions = new Float32Array(points.length * 3);
      for (let j = 0; j < points.length; j++) {
        positions[j * 3] = points[j].x;
        positions[j * 3 + 1] = points[j].y;
        positions[j * 3 + 2] = 0;
      }

      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );

      const material = new THREE.LineBasicMaterial({
        color: rainbowColors[i],
        linewidth: 10,
      });

      const rainbow = new THREE.Line(geometry, material);
      rainbowGroup.add(rainbow);
    }

    // Position the rainbow
    rainbowGroup.position.set(0, 400, -700);
    rainbowGroup.rotation.x = Math.PI / 2; // Rotate to be vertical

    this.decorElements.rainbow = rainbowGroup;
    this.scene.add(rainbowGroup);
    console.log("SceneDecor: Rainbow added to scene");
  }

  /**
   * Creates initial set of clouds
   */
  _createInitialClouds() {
    console.log("SceneDecor: Creating initial clouds");
    for (let i = 0; i < this.config.cloudsCount; i++) {
      this._spawnCloud(true);
    }
    console.log(
      `SceneDecor: ${this.config.cloudsCount} initial clouds created`
    );
  }

  /**
   * Creates a single cloud
   * @param {boolean} isInitial - Whether this is part of the initial cloud generation
   */
  _spawnCloud(isInitial = false) {
    // Create a cloud group
    const cloud = new THREE.Group();

    // Random cloud properties
    const cloudSize = 30 + Math.random() * 50;
    const puffCount = 3 + Math.floor(Math.random() * 5);

    // Cloud material - make sure it's visible
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });

    // Create multiple puffs to form a cloud
    for (let i = 0; i < puffCount; i++) {
      const puffSize = (cloudSize / 2) * (0.5 + Math.random() * 0.6);
      const puffGeometry = new THREE.SphereGeometry(puffSize, 7, 7);
      const puff = new THREE.Mesh(puffGeometry, cloudMaterial);

      // Position puffs relative to each other
      const puffX = (i - puffCount / 2) * (puffSize * 0.7);
      const puffY = Math.random() * (puffSize * 0.2);
      const puffZ = Math.random() * (puffSize * 0.7) - puffSize * 0.3;

      puff.position.set(puffX, puffY, puffZ);
      cloud.add(puff);
    }

    // Position the cloud
    const radius = 800 + Math.random() * 400;
    let angle;

    if (isInitial) {
      // Place initial clouds randomly around the scene
      angle = Math.random() * Math.PI * 2;
    } else {
      // New clouds always start from one side
      angle = Math.PI / 2; // Start from right side of the scene
    }

    const cloudX = radius * Math.cos(angle);
    // Lower the cloud height significantly
    const cloudY = 100 + Math.random() * 50; // Lowered from 200-400 to 100-150
    const cloudZ = radius * Math.sin(angle);

    cloud.position.set(cloudX, cloudY, cloudZ);

    // Make clouds face the player
    cloud.lookAt(0, cloud.position.y, 0);

    // Set cloud movement properties
    cloud.userData = {
      speed: this.config.cloudSpeed * (0.7 + Math.random() * 0.6),
      angle: angle,
      radius: radius,
    };

    this.decorElements.clouds.push(cloud);
    this.scene.add(cloud);
  }

  /**
   * Updates all decorative elements
   * @param {number} delta - Time elapsed since last update
   */
  update(delta) {
    this._updateClouds(delta);
    this._updateRainbow(delta);
    this._updateSun(delta);
  }

  /**
   * Updates cloud positions and spawns new clouds
   * @param {number} delta - Time elapsed since last update
   */
  _updateClouds(delta) {
    // Update existing clouds
    const cloudsToRemove = [];

    this.decorElements.clouds.forEach((cloud, index) => {
      // Move cloud around the scene in a circle
      cloud.userData.angle -= cloud.userData.speed * delta;

      // Update position
      const x = cloud.userData.radius * Math.cos(cloud.userData.angle);
      const z = cloud.userData.radius * Math.sin(cloud.userData.angle);

      cloud.position.x = x;
      cloud.position.z = z;

      // Make clouds always face center
      cloud.lookAt(0, cloud.position.y, 0);

      // Check if cloud has completed a full circle and should be removed
      if (cloud.userData.angle < -Math.PI * 2) {
        cloudsToRemove.push(index);
      }
    });

    // Remove old clouds
    for (let i = cloudsToRemove.length - 1; i >= 0; i--) {
      const index = cloudsToRemove[i];
      this.scene.remove(this.decorElements.clouds[index]);
      this.decorElements.clouds.splice(index, 1);
    }

    // Spawn new clouds
    const currentTime = Date.now();
    if (currentTime - this.lastCloudSpawn > this.config.cloudSpawnRate) {
      this._spawnCloud();
      this.lastCloudSpawn = currentTime;
    }
  }

  /**
   * Updates the rainbow with slight animation
   * @param {number} delta - Time elapsed since last update
   */
  _updateRainbow(delta) {
    if (this.decorElements.rainbow) {
      // Make the rainbow gently pulsate
      const pulseFactor = Math.sin(Date.now() * 0.001) * 0.05 + 0.95;
      this.decorElements.rainbow.scale.set(1, pulseFactor, 1);

      // Slightly shift rainbow position based on time
      const offsetY = Math.sin(Date.now() * 0.0003) * 5;
      this.decorElements.rainbow.position.y = 400 + offsetY;
    }
  }

  /**
   * Updates the sun with subtle animations
   * @param {number} delta - Time elapsed since last update
   */
  _updateSun(delta) {
    if (this.decorElements.sun) {
      // Make the sun gently rotate
      this.decorElements.sun.rotation.z += delta * 0.1;
    }
  }

  /**
   * Debug function to check element visibility and scene details
   * Call from browser console: window.debugGame.sceneDecor.debug()
   */
  debug() {
    console.log("=== SCENE DECOR DEBUG INFO ===");
    console.log("Total objects in scene:", this.scene.children.length);
    console.log("Sky dome radius:", this.config.skyDomeRadius);
    console.log(
      "Sun position:",
      this.decorElements.sun ? this.decorElements.sun.position : "Not created"
    );
    console.log("Mountains count:", this.decorElements.mountains.length);
    console.log("Clouds count:", this.decorElements.clouds.length);
    console.log(
      "Rainbow position:",
      this.decorElements.rainbow
        ? this.decorElements.rainbow.position
        : "Not created"
    );
    console.log(
      "Scene background color:",
      this.scene.background ? this.scene.background.getHexString() : "None"
    );

    // Add a helper axis at the center of the scene for orientation
    const axesHelper = new THREE.AxesHelper(500);
    this.scene.add(axesHelper);
    console.log("Added axes helper to scene - Red: X, Green: Y, Blue: Z");

    // Add a wireframe to the sky dome to see its extent
    if (this.decorElements.sky && this.decorElements.sky.geometry) {
      const skyGeometry = this.decorElements.sky.geometry.clone();
      const wireframe = new THREE.WireframeGeometry(skyGeometry);
      const line = new THREE.LineSegments(wireframe);
      line.material.depthTest = false;
      line.material.opacity = 0.25;
      line.material.transparent = true;
      line.material.color.set(0xff00ff);
      this.scene.add(line);
      console.log("Added wireframe to sky dome for visibility");
    }

    return "Debug helpers added - check console for information";
  }
}
