// src/modules/grid.js

import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import { RigidBody } from './physics.js';

// static size of each grid cell in world units
const CELL_SIZE = 6;

/**
 * Create a ground plane and overlay grid lines sized by block counts.
 * Blocks are fixed at CELL_SIZE; grid spans widthBlocks × depthBlocks cells.
 * No diagonal grid lines—only axis-aligned.
 * @param {THREE.Scene} scene
 * @param {Ammo.btDiscreteDynamicsWorld} physicsWorld
 * @param {number} widthBlocks  Number of cells along the X-axis
 * @param {number} depthBlocks  Number of cells along the Z-axis
 * @returns {{ ground: THREE.Mesh, grid: THREE.Group, cellSize: number }}
 */
export function addGrid(scene, physicsWorld, widthBlocks = 10, depthBlocks = 10) {
  const width  = widthBlocks * CELL_SIZE;
  const depth  = depthBlocks * CELL_SIZE;

  // 1) Ground mesh
  const groundGeo = new THREE.BoxGeometry(width, 1, depth);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x404040 });
  const ground    = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  // 2) Grid lines group—draw only axis-aligned lines
  const grid = new THREE.Group();
  const lineMat = new THREE.LineBasicMaterial({ color: 0x888888 });

  // vertical lines (parallel to Z)
  for (let i = 0; i <= widthBlocks; i++) {
    const x = -width / 2 + i * CELL_SIZE;
    const points = [
      new THREE.Vector3(x, 0.51, -depth / 2),
      new THREE.Vector3(x, 0.51,  depth / 2)
    ];
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    grid.add(new THREE.Line(geom, lineMat));
  }

  // horizontal lines (parallel to X)
  for (let j = 0; j <= depthBlocks; j++) {
    const z = -depth / 2 + j * CELL_SIZE;
    const points = [
      new THREE.Vector3(-width / 2, 0.51, z),
      new THREE.Vector3( width / 2, 0.51, z)
    ];
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    grid.add(new THREE.Line(geom, lineMat));
  }

  scene.add(grid);

  // 3) Static physics body matching the ground
  const rb = new RigidBody();
  rb.createBox(
    0,
    ground.position,
    ground.quaternion,
    new THREE.Vector3(width, 1, depth)
  );
  physicsWorld.addRigidBody(rb.body_);

  return { ground, grid, cellSize: CELL_SIZE };
}