// src/modules/spawnShips.js

import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import { createShip } from './ships.js';

/**
 * Interactive placement of a fixed sequence of ships.
 * Users press WASD to move a semi-transparent preview ship along the grid,
 * press R to rotate via rotationY, and press Enter (or Space)
 * to lock it into place and advance to the next size.
 * Ships snap to grid boxes, cannot cross the wall at z=0,
 * and cannot overlap previously placed ships.
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera       (ignored)
 * @param {THREE.Mesh} ground         Ground mesh from addGrid()
 * @param {Ammo.btDiscreteDynamicsWorld} physicsWorld
 * @param {Array} rigidBodies         Array to push finalized ships into
 * @param {number} cellSize           Size of each grid block
 */
export function setupShipSpawner(scene, camera, ground, physicsWorld, rigidBodies, cellSize) {
  const lengths = [2, 3, 3, 4, 5];
  const occupied = new Set();                // track occupied block centers
  let currentIndex = 0;
  let previewGroup = null;
  let rotationY = 0;

  // grid half-sizes
  const halfW = ground.geometry.parameters.width / 2;
  const halfD = ground.geometry.parameters.depth / 2;

  function createPreview() {
    if (previewGroup) scene.remove(previewGroup);
    previewGroup = new THREE.Group();
    const blockCount = lengths[currentIndex];
    const totalLen = blockCount * cellSize;
    const halfLen = totalLen / 2;
    const blockHalf = cellSize / 2;

    // build transparent cubes
    for (let i = 0; i < blockCount; i++) {
      const geo = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
      const mat = new THREE.MeshStandardMaterial({ color: 0x3366ff, transparent: true, opacity: 0.5 });
      const cube = new THREE.Mesh(geo, mat);
      cube.position.set(-halfLen + blockHalf + i * cellSize, cellSize * 0.5, 0);
      previewGroup.add(cube);
    }

    // build transparent rods
    const rodGeo = new THREE.CylinderGeometry(cellSize * 0.2, cellSize * 0.2, cellSize);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.5 });
    for (let i = 0; i < blockCount - 1; i++) {
      const rod = new THREE.Mesh(rodGeo, rodMat);
      rod.rotation.z = Math.PI / 2;
      rod.position.set(-halfLen + cellSize + i * cellSize, cellSize, 0);
      previewGroup.add(rod);
    }

    // apply rotation
    previewGroup.rotation.y = rotationY;
    previewGroup.userData = { halfLen, blockHalf, blockCount };

    // initial position at first cell center, on negative side of wall
    previewGroup.position.set(
      -halfW + halfLen,
      0,
      -halfD + blockHalf
    );
    scene.add(previewGroup);
  }

  function finalizePreview() {
    if (!previewGroup) return;
    const { halfLen, blockHalf, blockCount } = previewGroup.userData;
    const pos = previewGroup.position.clone();
    pos.y = cellSize * 0.5;

    // compute block centers after rotation and check occupancy
    const cosR = Math.cos(rotationY), sinR = Math.sin(rotationY);
    const newKeys = [];
    for (let i = 0; i < blockCount; i++) {
      const localX = -halfLen + blockHalf + i * cellSize;
      const localZ = 0;
      const worldX = pos.x + (localX * cosR - localZ * sinR);
      const worldZ = pos.z + (localX * sinR + localZ * cosR);
      const key = `${Math.round(worldX)}/${Math.round(worldZ)}`;
      if (occupied.has(key)) {
        // flash preview red to indicate invalid placement
        previewGroup.children.forEach(c => {
          c.userData = c.userData || {};
          if (!c.userData.origColor) {
            c.userData.origColor = c.material.color.clone();
          }
          c.material.color.set(0xff0000);
        });
        setTimeout(() => {
          previewGroup.children.forEach(c => {
            if (c.userData && c.userData.origColor) {
              c.material.color.copy(c.userData.origColor);
              delete c.userData.origColor;
            }
          });
        }, 200);
        return;  // overlap found, abort placement
      }
      newKeys.push(key);
    }

    // instantiate real ship
    createShip(scene, physicsWorld, rigidBodies, pos, blockCount, cellSize);
    const last = rigidBodies[rigidBodies.length - 1];
    last.mesh.rotation.y = rotationY;

    // update physics transform
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    const quat = last.mesh.quaternion;
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    last.rigidBody.body_.setWorldTransform(transform);
    last.rigidBody.body_.getMotionState().setWorldTransform(transform);

    // mark occupied
    newKeys.forEach(k => occupied.add(k));

    scene.remove(previewGroup);
    previewGroup = null;
    currentIndex++;
    if (currentIndex < lengths.length) createPreview();
  }

  // begin placement
  createPreview();

  window.addEventListener('keydown', (e) => {
    if (!previewGroup) return;
    let { x, z } = previewGroup.position;
    const { halfLen, blockHalf } = previewGroup.userData;
    switch (e.key.toLowerCase()) {
      case 'a': // backward
        z = Math.max(z - cellSize, -halfD + blockHalf);
        break;
      case 'd': // forward
        z = Math.min(z + cellSize, -blockHalf);
        break;
      case 's': // left
        x = Math.max(x - cellSize, -halfW + halfLen);
        break;
      case 'w': // right
        x = Math.min(x + cellSize, halfW - halfLen);
        break;
      case 'r': // rotate
        rotationY = (rotationY + Math.PI / 2) % (2 * Math.PI);
        previewGroup.rotation.y = rotationY;
        break;
      case 'enter':
      case ' ':
        finalizePreview();
        return;
    }
    previewGroup.position.set(x, 0, z);
  });
}
