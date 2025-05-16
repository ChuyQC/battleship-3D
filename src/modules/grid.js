// src/modules/grid.js

import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import { RigidBody } from './physics.js';

/**
 * Create a ground plane with a grid overlay and static physics body.
 * @param {THREE.Scene} scene
 * @param {Ammo.btDiscreteDynamicsWorld} physicsWorld
 * @param {number} rows      Number of grid cells along Z-axis
 * @param {number} cols      Number of grid cells along X-axis
 * @param {number} cellSize  World-unit size of each grid cell
 * @returns {{ ground: THREE.Mesh, cellSize: number }}
 */
export function addGrid(scene, physicsWorld, rows = 10, cols = 10, cellSize = 6) {
  const width = cols * cellSize;
  const depth = rows * cellSize;

  // 1) Ground mesh (flat box)
  const groundGeo = new THREE.BoxGeometry(width, 1, depth);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x03030 });
  const ground    = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

// 2) Grid overlay on XZ-plane (slightly above the ground so it’s visible)
const gridHelper = new THREE.GridHelper(
    Math.max(width, depth),
    Math.max(cols, rows),
    0x888888,
    0x444444
  );
  gridHelper.position.y = 0.52;  // ground is 1 unit tall, so top sits at 0.5
  scene.add(gridHelper);

  // 3) Static physics body matching the ground
  const rb = new RigidBody();
  rb.createBox(
    0,
    ground.position,
    ground.quaternion,
    new THREE.Vector3(width, 1, depth)
  );
  physicsWorld.addRigidBody(rb.body_);

  return { ground, cellSize };
}
