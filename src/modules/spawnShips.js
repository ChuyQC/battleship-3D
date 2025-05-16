// src/modules/spawnShips.js

import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import { createShip } from './ships.js';

/**
 * Interactive placement of a fixed sequence of ships.
 * After placing all blue ships on the negative-Z side, you enter the red-phase
 * and place red ships on the positive-Z side. Overlap flashes green in red-phase.
 */
export function setupShipSpawner(scene, camera, ground, physicsWorld, rigidBodies, cellSize) {
  const lengths    = [2, 3, 3, 4, 5];
  const occupied   = new Set();
  let currentIndex = 0;
  let previewGroup = null;
  let rotationY    = 0;
  let isRedPhase   = false;

  // grid half-sizes in world units
  const halfW    = ground.geometry.parameters.width  / 2;
  const halfD    = ground.geometry.parameters.depth  / 2;
  const cellHalf = cellSize / 2;

  // map a world position to “i/j” cell coords
  function worldToKey(wx, wz) {
    const i = Math.round((wx + halfW  - cellHalf) / cellSize);
    const j = Math.round((wz + halfD  - cellHalf) / cellSize);
    return `${i}/${j}`;
  }

  // compute minZ/maxZ for the *group origin* so the whole ship
  // never crosses z=0 (wall) or the far grid edge
  function computeZBounds(halfLen) {
    const isRotated = Math.abs(Math.sin(rotationY)) > 0.5;
    const offset    = halfLen - cellHalf;  // how far the ends stick out when rotated

    let minZ, maxZ;
    if (!isRotated) {
      // no extra overhang on Z
      if (isRedPhase) {
        minZ =  cellHalf;
        maxZ =  halfD - cellHalf;
      } else {
        minZ = -halfD + cellHalf;
        maxZ = -cellHalf;
      }
    } else {
      // must stay offset away from the wall/far edge
      if (isRedPhase) {
        minZ =  offset;
        maxZ =  halfD - offset;
      } else {
        minZ = -halfD + offset;
        maxZ = -offset;
      }
    }
    return { minZ, maxZ };
  }

  function createPreview() {
    if (previewGroup) scene.remove(previewGroup);
    previewGroup = new THREE.Group();

    const blockCount = lengths[currentIndex];
    const totalLen   = blockCount * cellSize;
    const halfLen    = totalLen / 2;

    // build transparent cubes
    const previewColor = isRedPhase ? 0xff0000 : 0x3366ff;
    for (let i = 0; i < blockCount; i++) {
      const geo = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
      const mat = new THREE.MeshStandardMaterial({
        color:      previewColor,
        transparent: true,
        opacity:     0.5
      });
      const cube = new THREE.Mesh(geo, mat);
      cube.position.set(
        -halfLen + cellHalf + i * cellSize,
         cellHalf,
         0
      );
      previewGroup.add(cube);
    }

    // build rods
    const rodGeo = new THREE.CylinderGeometry(cellSize * 0.2, cellSize * 0.2, cellSize);
    const rodMat = new THREE.MeshStandardMaterial({
      color:      0x333333,
      transparent: true,
      opacity:     0.5
    });
    for (let i = 0; i < blockCount - 1; i++) {
      const rod = new THREE.Mesh(rodGeo, rodMat);
      rod.rotation.z = Math.PI / 2;
      rod.position.set(
        -halfLen + cellSize + i * cellSize,
        cellSize,
        0
      );
      previewGroup.add(rod);
    }

    // apply rotation & store geometry
    previewGroup.rotation.y = rotationY;
    previewGroup.userData = { halfLen, blockHalf: cellHalf, blockCount };

    // compute Z-bounds and set initial position
    const { minZ, maxZ } = computeZBounds(halfLen);
    previewGroup.userData.minZ = minZ;
    previewGroup.userData.maxZ = maxZ;
    previewGroup.position.set(
      -halfW + halfLen,
      0,
      minZ
    );

    scene.add(previewGroup);
  }

  function finalizePreview() {
    if (!previewGroup) return;
    const { halfLen, blockCount } = previewGroup.userData;
    const pos = previewGroup.position.clone();
    pos.y = cellHalf;

    const cosR = Math.cos(rotationY), sinR = Math.sin(rotationY);
    const newKeys = [];

    for (let i = 0; i < blockCount; i++) {
      const localX = -halfLen + cellHalf + i * cellSize;
      const worldX = pos.x + (localX * cosR);
      const worldZ = pos.z + (localX * sinR);
      const key    = worldToKey(worldX, worldZ);

      if (occupied.has(key)) {
        // flash to indicate invalid
        const flashColor = isRedPhase ? 0x00ff00 : 0xff0000;
        previewGroup.children.forEach(c => {
          c.userData = c.userData || {};
          if (!c.userData.orig) {
            c.userData.orig = c.material.color.clone();
          }
          c.material.color.set(flashColor);
        });
        setTimeout(() => {
          previewGroup.children.forEach(c => {
            if (c.userData && c.userData.orig) {
              c.material.color.copy(c.userData.orig);
              delete c.userData.orig;
            }
          });
        }, 200);
        return;
      }

      newKeys.push(key);
    }

    // place the real ship
    createShip(scene, physicsWorld, rigidBodies, pos, blockCount, cellSize);
    const last = rigidBodies[rigidBodies.length - 1];
    last.mesh.rotation.y = rotationY;

    // sync physics
    const tf = new Ammo.btTransform();
    tf.setIdentity();
    tf.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    const q = last.mesh.quaternion;
    tf.setRotation(new Ammo.btQuaternion(q.x, q.y, q.z, q.w));
    last.rigidBody.body_.setWorldTransform(tf);
    last.rigidBody.body_.getMotionState().setWorldTransform(tf);

    // color the final ship
    const finalColor = isRedPhase ? 0xff0000 : 0x3366ff;
    last.mesh.traverse(m => m.isMesh && m.material.color.set(finalColor));

    // mark occupied
    newKeys.forEach(k => occupied.add(k));

    // advance phase/index
    scene.remove(previewGroup);
    previewGroup = null;
    currentIndex++;
    if (currentIndex < lengths.length) {
      createPreview();
    } else if (!isRedPhase) {
      isRedPhase   = true;
      currentIndex = 0;
      createPreview();
    }
  }

  // start
  createPreview();

  window.addEventListener('keydown', e => {
    if (!previewGroup) return;
    let { x, z } = previewGroup.position;
    const { halfLen, minZ, maxZ } = previewGroup.userData;

    switch (e.key.toLowerCase()) {
      case 'a': // backward
        z = Math.max(z - cellSize, minZ);
        break;
      case 'd': // forward
        z = Math.min(z + cellSize, maxZ);
        break;
      case 's': // left
        x = Math.max(x - cellSize, -halfW + halfLen);
        break;
      case 'w': // right
        x = Math.min(x + cellSize,  halfW - halfLen);
        break;
      case 'r': // rotate
        rotationY = (rotationY + Math.PI / 2) % (2 * Math.PI);
        previewGroup.rotation.y = rotationY;
        // recalc bounds & clamp
        {
          const { halfLen } = previewGroup.userData;
          const b = computeZBounds(halfLen);
          previewGroup.userData.minZ = b.minZ;
          previewGroup.userData.maxZ = b.maxZ;
          z = Math.max(b.minZ, Math.min(b.maxZ, z));
        }
        break;
      case 'enter':
      case ' ':
        finalizePreview();
        return;
    }

    previewGroup.position.set(x, 0, z);
  });
}
