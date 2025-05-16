// src/modules/spawnShips.js

import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import { createShip } from './ships.js';

/**
 * Enable click‐and‐snap spawning of ships on a grid, with rotation toggled by 'R'.
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @param {THREE.Mesh} groundMesh    Mesh returned from addGrid()
 * @param {Ammo.btDiscreteDynamicsWorld} physicsWorld
 * @param {Array} rigidBodies        Array passed to addShips/createShip
 * @param {number} cellSize          Grid cell size (same as used in addGrid)
 */
export function setupShipSpawner(scene, camera, groundMesh, physicsWorld, rigidBodies, cellSize) {
  let currentRotationY = 0;
  let currentBlocks = 3;

  // Rotate turret orientation by 90° on 'R'
  window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'r') {
      currentRotationY = (currentRotationY + Math.PI / 2) % (2 * Math.PI);
    }
  });

  const raycaster = new THREE.Raycaster();
  const pointer   = new THREE.Vector2();

  window.addEventListener('pointerdown', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObject(groundMesh);
    if (intersects.length > 0) {
      const pt = intersects[0].point;
      const x  = Math.round(pt.x / cellSize) * cellSize;
      const z  = Math.round(pt.z / cellSize) * cellSize;
      const pos = new THREE.Vector3(x, groundMesh.position.y + 1, z);

      // spawn & rotate
      createShip(scene, physicsWorld, rigidBodies, pos, currentBlocks);
      const last = rigidBodies[rigidBodies.length - 1];
      last.mesh.rotation.y = currentRotationY;
    }
  });
}
