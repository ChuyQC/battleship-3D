// src/modules/camera.js

import * as THREE from 'https://cdn.skypack.dev/three@0.136';

/**
 * Create a birds-eye perspective camera looking down at the scene center,
 * with the X-axis oriented vertically on screen.
 */
export function createCamera() {
  const fov    = 60;
  const aspect = window.innerWidth / window.innerHeight;
  const near   = 1.0;
  const far    = 1000.0;

  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  // Position directly above the scene
  camera.position.set(0, 120, 0);

  // Use world X as the 'up' direction for the camera, so X-axis points upward on screen
  camera.up.set(1, 0, 0);

  // Look straight down at origin
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  return camera;
}
