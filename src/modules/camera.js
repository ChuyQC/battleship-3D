import * as THREE from 'https://cdn.skypack.dev/three@0.136';

export function createCamera() {
  const fov    = 60;
  const aspect = window.innerWidth  / window.innerHeight;
  const near   = 1.0;
  const far    = 1000.0;

  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(75, 20, 0);
  return camera;
}
