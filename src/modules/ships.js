// src/modules/ships.js

import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import { RigidBody, DEFAULT_MASS } from './physics.js';

const UNIT_LENGTH = 6;  // one “block” = 6 units

/**
 * Create one ship: a rectangular prism of `blockCount * UNIT_LENGTH` long,
 * plus two thin barrel rods mounted on top, pointing upwards.
 */
export function createShip(scene, physicsWorld, rigidBodies, position, blockCount = 3) {
  // compute base size
  const width     = UNIT_LENGTH * blockCount;
  const height    = 2;
  const depth     = 4;
  const baseSize  = new THREE.Vector3(width, height, depth);

  // build visual group
  const ship = new THREE.Group();

  // 1) Prism base
  const baseGeo  = new THREE.BoxGeometry(width, height, depth);
  const baseMat  = new THREE.MeshStandardMaterial({ color: 0x3366ff });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.castShadow    = true;
  baseMesh.receiveShadow = true;
  ship.add(baseMesh);

  // 2) Two barrel-rods on top, pointing up
  const rodLength = 4;
  const rodGeo    = new THREE.CylinderGeometry(0.1, 0.1, rodLength);
  const rodMat    = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const xOffset   = width * 0.25;         // quarter-width in from each side
  const yOffset   = height * 0.5 + rodLength * 0.5;  // rod base sits on top of hull

  [ xOffset, -xOffset ].forEach(xo => {
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.castShadow    = true;
    rod.receiveShadow = true;
    // leave cylinder's Y-axis upright
    rod.rotation.x    = 0;
    // position so rod base is flush on top center of hull
    rod.position.set(xo, yOffset, 0);
    ship.add(rod);
  });

  // 3) position & add to scene
  ship.position.copy(position);
  scene.add(ship);

  // 4) physics body on the prism only
  const rb = new RigidBody();
  rb.createBox(
    DEFAULT_MASS,
    ship.position,
    ship.quaternion,
    baseSize
  );
  rb.setFriction(1);
  physicsWorld.addRigidBody(rb.body_);

  // track for updates/cleanup
  rigidBodies.push({ mesh: ship, rigidBody: rb });
}

/**
 * Spawn an array of ships whose block-lengths are given by `lengths`.
 * Defaults to [2,3,3,4,5].
 */
export function addShips(scene, physicsWorld, rigidBodies, lengths = [2, 3, 3, 4, 5]) {
  const spacing = UNIT_LENGTH * 2.5;      // gap between ship centers
  const total   = lengths.length;
  const startX  = -((total - 1) * spacing) / 2;

  lengths.forEach((blocks, i) => {
    const x   = startX + i * spacing;
    const pos = new THREE.Vector3(x, /*y=*/2, /*z=*/0);
    createShip(scene, physicsWorld, rigidBodies, pos, blocks);
  });
}