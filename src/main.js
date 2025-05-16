// src/main.js

import { createCamera }        from './modules/camera.js';
import {
  createRenderer,
  buildScene,
  setupControls,
  setupResize
}                               from './modules/scene.js';
import { initPhysics }          from './modules/physics.js';
import { addGrid }              from './modules/grid.js';
import { addShips }             from './modules/ships.js';
import { setupShipSpawner }     from './modules/spawnShips.js';

let rigidBodies = [];
let tmpTransform;

window.addEventListener('DOMContentLoaded', () => {
  Ammo().then(lib => {
    Ammo = lib;

    // Renderer & Scene
    const renderer    = createRenderer();
    const camera      = createCamera();
    const scene       = buildScene();
    setupControls(camera, renderer);
    setupResize(camera, renderer);

    // Physics
    const physicsWorld = initPhysics();
    tmpTransform       = new Ammo.btTransform();

    // Ground + Grid (20×20 cells of size 6 units)
    const { ground, cellSize } = addGrid(scene, physicsWorld, 20, 20, 6);

    // Optional: spawn initial ships
    addShips(scene, physicsWorld, rigidBodies);

    // Enable click-and-snap spawning with 'R' rotation
    setupShipSpawner(
      scene,
      camera,
      ground,
      physicsWorld,
      rigidBodies,
      cellSize
    );

    // Animation loop
    let prevTime = null;
    function animate(time) {
      if (!prevTime) prevTime = time;
      const delta = (time - prevTime) * 0.001;
      prevTime     = time;

      // Step physics
      physicsWorld.stepSimulation(delta, 10);

      // Sync Three.js meshes with Ammo bodies
      for (const { mesh, rigidBody } of rigidBodies) {
        rigidBody.motionState_.getWorldTransform(tmpTransform);
        const p = tmpTransform.getOrigin();
        const q = tmpTransform.getRotation();
        mesh.position.set(p.x(), p.y(), p.z());
        mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  });
});
