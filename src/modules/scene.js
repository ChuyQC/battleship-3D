import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.136/examples/jsm/controls/OrbitControls.js';

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function buildScene() {
  const scene = new THREE.Scene();

  // Directional light
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(20, 100, 10);
  dirLight.target.position.set(0, 0, 0);
  dirLight.castShadow = true;
  dirLight.shadow.bias   = -0.001;
  dirLight.shadow.mapSize.set(2048, 2048);
  Object.assign(dirLight.shadow.camera, {
    near: 0.5, far: 500,
    left: 100, right: -100,
    top: 100, bottom: -100
  });
  scene.add(dirLight);

  // Ambient fill
  scene.add(new THREE.AmbientLight(0x101010));

  // Skybox
  const loader = new THREE.CubeTextureLoader();
  scene.background = loader.load([
    './resources/posx.jpg',
    './resources/negx.jpg',
    './resources/posy.jpg',
    './resources/negy.jpg',
    './resources/posz.jpg',
    './resources/negz.jpg',
  ]);

  return scene;
}

export function setupControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 20, 0);
  controls.update();
}

export function setupResize(camera, renderer) {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
