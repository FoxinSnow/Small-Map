/**
 * author: Fei HUANG 1794177
 *
 * This file is used to demo the library.
 * It creates a 3D environment with three.js and use the small.js in this environment.
 * It used the OrbitControls.js to control the camera moving.
 */

"use strict";
function init(){
    threeStart();
}

let renderer;
function initThree(){
    renderer = new THREE.WebGLRenderer({
        antialias : true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('myCanvas').appendChild(renderer.domElement);
    renderer.setClearColor('#E0FFFF', 1);
}

let camera;
function initCamera(){
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.set(0, 300, 0);
    camera.up.set(0, 1, 0);
    camera.lookAt(new THREE.Vector3( 0, 0, 0 ) );
}

let controls;
function initControls(){
    controls = new THREE.OrbitControls(camera);
    controls.update();
}

let scene;
function initScene(){
    scene = new THREE.Scene();
}

let light, light2;
function initLight(){
    light = new THREE.DirectionalLight('#ffffff');
    light.position.set(50, 400, 0);
    scene.add(light);

    light2 = new THREE.DirectionalLight('#ffffff');
    light2.position.set(0, -100, 0);
    scene.add(light2);
}

function animate() {
    controls.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function threeStart(){
    initThree();
    initCamera();
    initControls();
    initScene();
    initLight();
    initTerrain();
    renderer.clear();
    animate();
}

/**
 * Use the three.js here.
 */
function initTerrain(){

    let terr;
    terr = new SmallMap();
    terr.setTerrainEnvironment(0.9, 0.85, 0.6, 0.45, 0.4);
    let a = terr.createTerrain(600, 200, 374, 0.5);

    let wayPoints = [0, 0, 1, 2, 3, 5];
    let b = terr.developerView(false, true, -1, true, false, [], -1);

    /**
     * The below codes add the terrain and the sea level to the scene.
     */
    scene.add(a[0]);
    scene.add(a[1]);

    /**
     * The below codes add the object return by the developerView functions to the scene.
     */
    //scene.add(b[2]);
    scene.add(b[3]);
    //console.log(b[5]);
    //scene.add(b[6]);
}
