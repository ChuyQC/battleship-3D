import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import { RigidBody, DEFAULT_MASS } from './physics.js';

export function addGround(scene, physicsWorld) {
  const geo = new THREE.BoxGeometry(100, 1, 100);
  const mat = new THREE.MeshStandardMaterial({ color: 0x404040 });
  const ground = new THREE.Mesh(geo, mat);
  ground.castShadow   = false;
  ground.receiveShadow= true;
  scene.add(ground);

  const rb = new RigidBody();
  rb.createBox(0, ground.position, ground.quaternion, new THREE.Vector3(100, 1, 100));
  rb.setRestitution(0.99);
  physicsWorld.addRigidBody(rb.body_);
}

export function addStack(scene, physicsWorld) {
  const rigidBodies = [];
  let isSphere = true;

  for (let xi = -4; xi < 4; xi++) {
    for (let zi = -4; zi < 4; zi++) {
      const height = Math.random() * (isSphere ? 20 : 5) + 40;
      let mesh, rb;

      if (isSphere) {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(4),
          new THREE.MeshStandardMaterial({ color: 0x808080 })
        );
        rb = new RigidBody();
        rb.createSphere(1, mesh.position.set(xi * 10, height, zi * 10), 4);
        rb.setRestitution(0.5);
        rb.setFriction(1);
        rb.setRollingFriction(1);

      } else {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(4, 4, 4),
          new THREE.MeshStandardMaterial({ color: 0x808080 })
        );
        rb = new RigidBody();
        rb.createBox(
          1,
          mesh.position.set(xi * 10, height, zi * 10),
          mesh.quaternion,
          new THREE.Vector3(4, 4, 4)
        );
        rb.setRestitution(0.25);
        rb.setFriction(1);
        rb.setRollingFriction(5);
      }

      mesh.castShadow   = true;
      mesh.receiveShadow= true;
      scene.add(mesh);
      physicsWorld.addRigidBody(rb.body_);
      rigidBodies.push({ mesh, rigidBody: rb });

      isSphere = !isSphere;
    }
  }

  return rigidBodies;
}

export function spawnRandom(scene, physicsWorld, rigidBodies) {
  const scale = Math.random() * 4 + 4;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(scale, scale, scale),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
  );
  mesh.position.set(Math.random() * 2 - 1, 200, Math.random() * 2 - 1);
  mesh.quaternion.set(0, 0, 0, 1);
  mesh.castShadow   = true;
  mesh.receiveShadow= true;
  scene.add(mesh);

  const rb = new RigidBody();
  rb.createBox(
    DEFAULT_MASS,
    mesh.position,
    mesh.quaternion,
    new THREE.Vector3(scale, scale, scale)
  );
  rb.setRestitution(0.125);
  rb.setFriction(1);
  rb.setRollingFriction(5);
  physicsWorld.addRigidBody(rb.body_);
  rigidBodies.push({ mesh, rigidBody: rb });
}

export function clearObjects(scene, physicsWorld, rigidBodies) {
    rigidBodies.forEach(({ mesh, rigidBody }) => {
      // 1) remove from physics world
      physicsWorld.removeRigidBody(rigidBody.body_);
      // 2) remove mesh from scene
      scene.remove(mesh);
      // 3) free Ammo memory
      Ammo.destroy(rigidBody.body_);
      Ammo.destroy(rigidBody.info_);
      Ammo.destroy(rigidBody.shape_);
      Ammo.destroy(rigidBody.motionState_);
      Ammo.destroy(rigidBody.transform_);
    });
    // clear your JS array
    rigidBodies.length = 0;
  }

  export function addWall(scene, physicsWorld) {
    // wall dimensions: 100 wide × 10 tall × 1 deep
    const size = new THREE.Vector3(100, 10, 1);
    const geo  = new THREE.BoxGeometry(size.x, size.y, size.z);
    const mat  = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const wall = new THREE.Mesh(geo, mat);
  
    // lift it so its base sits on y=0 (ground is at y=0.5)
    wall.position.set(0, size.y * 0.5, 0);
    wall.castShadow    = false;
    wall.receiveShadow = true;
    scene.add(wall);
  
    // make it static in Ammo
    const rb = new RigidBody();
    rb.createBox(
      0,
      wall.position,
      wall.quaternion,
      size
    );
    physicsWorld.addRigidBody(rb.body_);
  }