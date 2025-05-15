import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { max, rand } from 'three/tsl';


/*
* Variables
*
*/
const pointsUI = document.querySelector("#points");
let points = 0;

const randomRageNum = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const moveObstacles =(arr, speed, maxX, minX, maxZ, minZ) => {
  arr.forEach((el) => {
    el.position.z += speed;
    if(el.position.z > camera.position.z) {
      el.position.z = randomRageNum(minZ, maxZ);
      el.position.x = randomRageNum(minX, maxX);
    }
  });
};


/*
* Scene Setup
*
*/
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
   75, window.innerWidth / window.innerHeight, 
   0.1, 
   1000 
);
camera.position.z = 4.5;
camera.position.y = 1.5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


/*
* Ground
*/
const ground = new THREE.Mesh( new THREE.BoxGeometry( 30, 1, 30 )
, new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
);
ground.position.y = -1;
scene.add( ground );

/*
* Piece
*
*/ 
const piece = new THREE.Mesh( new THREE.BoxGeometry( 0.5, 0.5, 0.5 )
, new THREE.MeshBasicMaterial( { color: 0xFF0000 } )
);
ground.position.y = -1;
scene.add( piece );

/*
* Power up
*
*/
const powerUps = []
for(let i = 0; i < 10; i++) {
  const powerUp = new THREE.Mesh( 
    new THREE.TorusGeometry( 1, 0.4, 16, 50 ),
    new THREE.MeshBasicMaterial( { color: 0xFFFF00 } )
  );
  powerUp.position.x = randomRageNum(-8, 8);
  powerUp.position.z = randomRageNum(-5, 5)

  powerUp.scale.set(0.1, 0.1, 0.1);
  powerUp.name = "powerUp";
  powerUps.push(powerUp);
  scene.add( powerUp );
 
}


/*
* Grid Helper
*
*/
const gridHelper = new THREE.GridHelper( 30, 30 );
scene.add(gridHelper);

/*
* Controls
*
*/

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled






/*
*
* Animation loop
*
*/

function animate() {
  requestAnimationFrame( animate );

  moveObstacles(powerUps, 0.1, 8, -8, 5, -5);
  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
  renderer.render( scene, camera );

}
animate();

/*
Event listers
*/

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
})

window.addEventListener("keydown", (e) => {
  if(e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
    piece.position.x += 0.1;
  }
  if(e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
    piece.position.x -= 0.1;
  }
  if(e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
    piece.position.z -= 0.1;
  }
  if(e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
    piece.position.z += 0.1;
  }
 })