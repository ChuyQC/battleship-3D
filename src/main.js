import { createCamera } from './modules/camera.js';
import {
  createRenderer,
  buildScene,
  setupControls,
  setupResize
} from './modules/scene.js';
import { initPhysics } from './modules/physics.js';
import { addGround, addStack, spawnRandom } from './modules/objects.js';
import { addWall } from './modules/objects.js';
import { addShips } from './modules/ships.js';  


let rigidBodies = [];
let tmpTransform;

window.addEventListener('DOMContentLoaded', () => {
  Ammo().then((lib) => {
    Ammo = lib;
    // three.js setup
    const renderer = createRenderer();
    const camera   = createCamera();
    const scene    = buildScene();
    setupControls(camera, renderer);
    setupResize(camera, renderer);

    // physics setup
    const physicsWorld = initPhysics();
    tmpTransform = new Ammo.btTransform();

    // populate
    addGround(scene, physicsWorld);
    addWall(scene, physicsWorld);
    //rigidBodies = addStack(scene, physicsWorld);

    // ← spawn ships from the new module
    addShips(scene, physicsWorld, rigidBodies);

    // main loop
    let prevTime = null;
    let countdown = 1.0;
    let spawnCount = 0;

    function animate(time) {
      if (!prevTime) prevTime = time;
      const delta = (time - prevTime) * 0.001;
      prevTime = time;

      // spawn logic
      //countdown -= delta;
      //if (countdown < 0 && spawnCount < 10) {
      //  countdown = 0.25;
      //  spawnCount++;
      //  spawnRandom(scene, physicsWorld, rigidBodies);
      //}

      // physics step
      physicsWorld.stepSimulation(delta, 10);
      for (const { mesh, rigidBody } of rigidBodies) {
        rigidBody.motionState_.getWorldTransform(tmpTransform);
        const pos  = tmpTransform.getOrigin();
        const quat = tmpTransform.getRotation();
        mesh.position.set(pos.x(), pos.y(), pos.z());
        mesh.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  });
});
