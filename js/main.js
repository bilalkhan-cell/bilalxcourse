// --- 1. GLOBAL GAME STATE ---
window.mazeGrid = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 3, 1],
  [1, 1, 1, 1, 1, 1, 1]
];

// We make the camera state global so all scripts know which view you are in
window.isFirstPerson = true; 

// --- 2. COLLISION & ADVANCED ROTATION LOGIC ---
AFRAME.registerComponent('player-collider', {
  init: function() {
    this.lastSafePosition = new THREE.Vector3();
    this.lastSafePosition.copy(this.el.object3D.position);
    
    this.cameraEl = document.getElementById('camera');
    this.playerBody = document.getElementById('player-body');

    this.keys = { shift: false, a: false, d: false };
    
    // We use this to track the character's independent spin in 3rd person
    this.bodyOffset = 0; 

    // Listen for keys being pressed down
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Shift') {
        this.keys.shift = true;
        // Turn off WASD movement so the player doesn't walk while holding Shift!
        this.el.setAttribute('wasd-controls', 'enabled', false);
      }
      if (event.key.toLowerCase() === 'a') this.keys.a = true;
      if (event.key.toLowerCase() === 'd') this.keys.d = true;
    });

    // Listen for keys being let go
    window.addEventListener('keyup', (event) => {
      if (event.key === 'Shift') {
        this.keys.shift = false;
        // Snap the character back to facing forward
        this.bodyOffset = 0; 
        // Turn walking back on!
        this.el.setAttribute('wasd-controls', 'enabled', true);
      }
      if (event.key.toLowerCase() === 'a') this.keys.a = false;
      if (event.key.toLowerCase() === 'd') this.keys.d = false;
    });
  },
  
  tick: function () {
    const turnSpeed = 0.05;

    // Handle Shift + A/D Rotation
    if (this.keys.shift) {
      if (window.isFirstPerson) {
        // --- 1ST PERSON: Rotate Camera ---
        if (this.cameraEl && this.cameraEl.components['look-controls']) {
          if (this.keys.a) this.cameraEl.components['look-controls'].yawObject.rotation.y += turnSpeed;
          if (this.keys.d) this.cameraEl.components['look-controls'].yawObject.rotation.y -= turnSpeed;
        }
      } else {
        // --- 3RD PERSON: Rotate ONLY the Character Body ---
        if (this.keys.a) this.bodyOffset += turnSpeed;
        if (this.keys.d) this.bodyOffset -= turnSpeed;
      }
    }

    // Apply the rotation to the body (Camera Rotation + Independent Spin Offset)
    if (this.cameraEl && this.playerBody) {
      this.playerBody.object3D.rotation.y = this.cameraEl.object3D.rotation.y + this.bodyOffset;
    }

    // --- BULLETPROOF COLLISION MATH ---
    let pos = this.el.object3D.position;
    let col = Math.round(pos.x / 3);
    let row = Math.round(pos.z / 3);

    if (window.mazeGrid[row] !== undefined) {
      let currentTile = window.mazeGrid[row][col];

      if (currentTile === 1) {
        pos.x = this.lastSafePosition.x;
        pos.z = this.lastSafePosition.z;
      } 
      else if (currentTile === 3) {
        alert("You Escaped the Maze!");
        pos.set(3, 0, 3); 
        this.lastSafePosition.copy(pos);
        if (window.resetToFirstPerson) window.resetToFirstPerson();
      } 
      else {
        this.lastSafePosition.x = pos.x;
        this.lastSafePosition.z = pos.z;
      }
    } else {
      pos.x = this.lastSafePosition.x;
      pos.z = this.lastSafePosition.z;
    }
  }
});

// --- 3. MAZE BUILDER LOGIC ---
AFRAME.registerComponent('maze-builder', {
  init: function () {
    const sceneEl = this.el; 
    const blockSize = 3;     

    for (let row = 0; row < window.mazeGrid.length; row++) {
      for (let col = 0; col < window.mazeGrid[row].length; col++) {
        
        let tile = window.mazeGrid[row][col];
        let posX = col * blockSize;
        let posY = 1.5; 
        let posZ = row * blockSize;

        if (tile === 1) {
          let wall = document.createElement('a-box');
          wall.setAttribute('position', `${posX} ${posY} ${posZ}`);
          wall.setAttribute('width', blockSize);
          wall.setAttribute('height', '3'); 
          wall.setAttribute('depth', blockSize);
          wall.setAttribute('color', '#4CC3D9');
          sceneEl.appendChild(wall);
        } 
        else if (tile === 3) {
          let exit = document.createElement('a-box');
          exit.setAttribute('position', `${posX} ${posY} ${posZ}`);
          exit.setAttribute('width', blockSize);
          exit.setAttribute('height', '3');
          exit.setAttribute('depth', blockSize);
          exit.setAttribute('color', '#7BC8A4');
          exit.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 3000');
          sceneEl.appendChild(exit);
        }
      }
    }
  }
});

// --- 4. CAMERA TOGGLE LOGIC (Press V) ---
window.addEventListener('load', () => {
  const camera = document.getElementById('camera');
  const playerBody = document.getElementById('player-body');

  window.resetToFirstPerson = function() {
    window.isFirstPerson = true;
    camera.setAttribute('position', '0 1.6 0');
    playerBody.setAttribute('visible', 'false');
  };

  window.addEventListener('keydown', (event) => {
    if (event.key === 'v' || event.key === 'V') {
      // Flips the global state
      window.isFirstPerson = !window.isFirstPerson; 

      if (window.isFirstPerson) {
        camera.setAttribute('position', '0 1.6 0');
        playerBody.setAttribute('visible', 'false');
      } else {
        camera.setAttribute('position', '0 5 4');
        playerBody.setAttribute('visible', 'true');
      }
    }
  });
});