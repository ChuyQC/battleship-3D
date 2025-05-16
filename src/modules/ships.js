// src/modules/ships.js

import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import { RigidBody, DEFAULT_MASS } from './physics.js';

// Size of one grid block
const UNIT_LENGTH = 6;

/**
 * Create one ship composed of `blockCount` cube blocks of size UNIT_LENGTH,
 * connected by rods between adjacent blocks.
 * @param {THREE.Scene} scene
 * @param {Ammo.btDiscreteDynamicsWorld} physicsWorld
 * @param {Array} rigidBodies      Array to push the ship’s body into
 * @param {THREE.Vector3} position Center position for the ship
 * @param {number} blockCount      Number of blocks (e.g., 2,3,3,4,5)
 */
export function createShip(scene, physicsWorld, rigidBodies, position, blockCount = 3) {
  const blockSize   = UNIT_LENGTH;
  const totalLength = blockCount * blockSize;
  const halfLength  = totalLength / 2;

  // Group to hold all parts
  const shipGroup = new THREE.Group();

  // 1) Add cube blocks
  for (let i = 0; i < blockCount; i++) {
    const cubeGeo = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0x3366ff });
    const cube    = new THREE.Mesh(cubeGeo, cubeMat);
    cube.castShadow    = true;
    cube.receiveShadow = true;
    const xPos = -halfLength + blockSize * 0.5 + i * blockSize;
    cube.position.set(xPos, blockSize * 0.5, 0);
    shipGroup.add(cube);
  }

  // 2) Add connecting rods between blocks
  const rodGeo = new THREE.CylinderGeometry(blockSize * 0.1, blockSize * 0.1, blockSize);
  const rodMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  for (let i = 0; i < blockCount - 1; i++) {
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.castShadow    = true;
    rod.receiveShadow = true;
    // align along X-axis
    rod.rotation.z = Math.PI / 2;
    const xPos = -halfLength + blockSize + i * blockSize;
    rod.position.set(xPos, blockSize * 0.5, 0);
    shipGroup.add(rod);
  }

  // 3) Position ship group and add to scene
  shipGroup.position.copy(position);
  scene.add(shipGroup);

  // 4) Physics: one box body matching full ship envelope
  const bodySize = new THREE.Vector3(totalLength, blockSize, blockSize);
  const rb = new RigidBody();
  rb.createBox(
    DEFAULT_MASS,
    shipGroup.position,
    shipGroup.quaternion,
    bodySize
  );
  rb.setFriction(1);
  physicsWorld.addRigidBody(rb.body_);

  // 5) Track for updates
  rigidBodies.push({ mesh: shipGroup, rigidBody: rb });
}

/**
 * Spawn ships with block lengths specified by `lengths` array.
 * Defaults to [2,3,3,4,5].
 * @param {THREE.Scene} scene
 * @param {Ammo.btDiscreteDynamicsWorld} physicsWorld
 * @param {Array} rigidBodies
 * @param {number[]} lengths  e.g. [2,3,3,4,5]
 */
export function addShips(scene, physicsWorld, rigidBodies, lengths = [2, 3, 3, 4, 5]) {
  const spacing = UNIT_LENGTH * 2.5;
  const count   = lengths.length;
  const startX  = -((count - 1) * spacing) / 2;

  lengths.forEach((blocks, index) => {
    const x = startX + index * spacing;
    const pos = new THREE.Vector3(x, UNIT_LENGTH * 0.5, 0);
    createShip(scene, physicsWorld, rigidBodies, pos, blocks);
  });
}
