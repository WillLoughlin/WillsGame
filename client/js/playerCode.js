//Script that controls what happens player side
/*
Will Loughlin

Each player recieves a copy of this file on connection.
Movement is handled here and position is relayed to app.js server file
Everytime gameloop is called this file recieves position and direction of each other player
*/

import {GLTFLoader} from './GLTFLoader.js';
import {FBXLoader} from './FBXLoader.js';//used to load player model

//Width and height of screen, will be changed when screen is sized
var WIDTH = 500;
var HEIGHT = 500;

var name = localStorage.getItem("playerName");
console.log("Player name: " + name);
if (name == ""){
  console.log("player name not found, set to anonymous");
  name = "anonymous";
}

//View FOV
var FOV_degrees = 60;

//These store each player and block
var OTHER_PLAYER_LIST = {};
var PLAYER_MODEL_LIST = {};
var GUN_LIST = {};
var BLOCK_LIST = {};

var BULLET_CAM_LIST = {};
var BULLET_MODEL_LIST = {};

var ENEMY_BULLET_LIST = {};

var playerBoundingBox = false;

var kills = 0;
var deaths = 0;

var magSize = 7;
var ammo = magSize;
var reloading = false;
var reloadTime = 3;

//These get updated from the Server on connection
var playerSpeed = 0.05;
var playerHeight = 2;

var showCollisionOutline = false;//set to true to see spheres used in collision detection

var velocityUp = 0;
var gravSpeed = 0.01;
var jumpSpeed = 0.2

var bulletSpeed = 2;

//These variables used for movement
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let sprint = false;

//more movement

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

//THREE.js functionality
//https://www.youtube.com/watch?v=WRQey_qpJls&list=PLRtjMdoYXLf6mvjCmrltvsD0j12ZQDMfE&index=2&ab_channel=SonarSystems
var scene = new THREE.Scene();//creating 3d scene
var camera = new THREE.PerspectiveCamera(FOV_degrees,WIDTH/HEIGHT,0.1,1000);//creating camera, second two variables are distance not shown close and far

var renderer = new THREE.WebGLRenderer();//initialize renderer (basically canvas)
renderer.setSize(WIDTH,HEIGHT);//setting size to screen size
document.body.appendChild(renderer.domElement);//adding renderer to document

var geometry = new THREE.BoxGeometry(1,1,1);//width,depth,HEIGHT

var socket = io();
var selfID = 0;
//var indexSelf = 0;


//Getting player's self ID
socket.on('setID', function(playerID){
  selfID = playerID.id;
  console.log("New ID Set to: " + selfID);
  playerSpeed = playerID.spd;
  playerHeight = playerID.hgt;
});

console.log("sending name: " + name);
socket.emit('setName',{name:name});

socket.on('nameNeedsChange', function (data){
  name = data.name;
});


//First cube added to scene
/*
var cubeMaterials =
[
  new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('client/img/1.jpg'),side: THREE.DoubleSide}),//right side
  new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('client/img/2.jpg'),side: THREE.DoubleSide}),//left side
  new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('client/img/hardwood_floor.jpg'),side: THREE.DoubleSide}),//top side
  new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('client/img/4.jpg'),side: THREE.DoubleSide}),//bottom side
  new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('client/img/5.jpg'),side: THREE.DoubleSide}),//front side
  new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('client/img/6.jpg'),side: THREE.DoubleSide}),//back side
];//each image corresponds to different side

//create a material,color, or image texture
var material = new THREE.MeshBasicMaterial({color: 0xFFFFFF,wireframe:true});
var material = new THREE.MeshFaceMaterial(cubeMaterials);//call with image array
var cube = new THREE.Mesh(geometry,material);//creating cube
scene.add(cube);//adding cube to 3d scene
*/

camera.position.z = 5;//initialize camera position

camera.position.y = playerHeight + (playerHeight * 0.5);
camera.rotation.order = "YXZ";

// var hiddenBottomColor = 0x4a4642;
// var hiddenBottom = new Block(counter,36, 1.25, 48,"Block",4,1.5,4,"","","", hiddenBottomColor);

const geometryHidden = new THREE.BoxGeometry(4,2.5,4);
const materialHidden = new THREE.MeshBasicMaterial({color: 0x4a4642});
var hiddenBox = new THREE.Mesh(geometryHidden,materialHidden);
hiddenBox.position.x = 36;
hiddenBox.position.y = 3.25;
hiddenBox.position.z = 48;
scene.add(hiddenBox);

const hiddenWireGeom = new THREE.WireframeGeometry(geometryHidden);
const hiddenWireMat = new THREE.LineBasicMaterial({color: 0x000000});
const hiddenWire = new THREE.LineSegments(hiddenWireGeom, hiddenWireMat);
hiddenBox.add(hiddenWire);

//const geometryCylinder = new THREE.CylinderGeometry( 0.5, 0.5, 2, 32 );
const geometryPlayerBox = new THREE.BoxGeometry(0.5,2,0.5);
const materialBox = new THREE.MeshBasicMaterial( {color: 0x336BFF, wireframe:true} );
//cylinder = new THREE.Mesh( geometry, material );

//create gui
var reticleWidth = 0.01;
var reticleHeight = 0.015;
var reticleDist = 0.015;

const reticleGeometryTop = new THREE.BoxGeometry( reticleWidth, reticleHeight, reticleHeight);
const reticleMaterial = new THREE.MeshBasicMaterial( {color: 0x00FFFF} );
const cube = new THREE.Mesh( reticleGeometryTop, reticleMaterial );
cube.position.x = 0;
cube.position.y = reticleDist;
cube.position.z = -1;
cube.transparent = true;
//scene.add(cube);
camera.add(cube);

const reticleGeometrySide = new THREE.BoxGeometry( reticleHeight, reticleWidth, reticleWidth);
const cube2 = new THREE.Mesh( reticleGeometrySide, reticleMaterial );
cube2.position.x = reticleDist;
cube2.position.y = 0;
cube2.position.z = -1;
cube2.transparent = true;

//scene.add(cube);
camera.add(cube2);

const cube3 = new THREE.Mesh( reticleGeometrySide, reticleMaterial );
cube3.position.x = -1 * reticleDist;
cube3.position.y = 0;
cube3.position.z = -1;
cube3.transparent = true;

//scene.add(cube);
camera.add(cube3);

const cube4 = new THREE.Mesh( reticleGeometryTop, reticleMaterial );
cube4.position.x = 0;
cube4.position.y = -1 * reticleDist;
cube4.position.z = -1;
cube4.material.transparent = true;
//scene.add(cube);
camera.add(cube4);

//---------------------------Bottom Right GUI--------------------------------//

// var guiDistX = 0.92;
// var guiDistY = 0.65;
var guiDistX = 0.46;
var guiDistY = 0.30;

const bottomRightGeometry = new THREE.BoxGeometry( 0.25, 0.25, 0.001);
//const reticleMaterial = new THREE.MeshBasicMaterial( {color: 0x00FFFF} );
//const bottomRightGUI = new THREE.Mesh( reticleGeometryTop, reticleMaterial );

var canvasBR = document.createElement('canvas').getContext('2d');
canvasBR.canvas.width = 256;
canvasBR.canvas.height = 256;
canvasBR.fillStyle = '#FFF';
canvasBR.fillRect(0, 0, canvasBR.canvas.width, canvasBR.canvas.height);
const textureBR = new THREE.CanvasTexture(canvasBR.canvas);
const materialBR = new THREE.MeshBasicMaterial({
  map: textureBR,
  opacity: 0.8,
  transparent: true,
});
const bottomRightGUI = new THREE.Mesh(bottomRightGeometry, materialBR);
bottomRightGUI.position.x = guiDistX;
bottomRightGUI.position.y = -1 * guiDistY;
bottomRightGUI.position.z = -0.5;
camera.add(bottomRightGUI);
bottomRightGUI.material.map.needsUpdate = true;

canvasBR.fillStyle = '#000';
// canvasBR.fillRect(10,10,10,10);

canvasBR.font = "20px Georgia";
canvasBR.fillText("Bottom Right GUI", 10, 50);
//--------------------End Bottom Right GUI----------------------------//

//-------------------Bottom Left GUI----------------------------------//

const bottomLeftGeometry = new THREE.BoxGeometry( 0.25, 0.25, 0.001);
var canvasBL = document.createElement('canvas').getContext('2d');
canvasBL.canvas.width = 256;
canvasBL.canvas.height = 256;
canvasBL.fillStyle = '#FFF';
canvasBL.fillRect(0, 0, canvasBL.canvas.width, canvasBL.canvas.height);
const textureBL = new THREE.CanvasTexture(canvasBL.canvas);
const materialBL = new THREE.MeshBasicMaterial({
  map: textureBL,
  opacity: 0.8,
  transparent: true,
});
const bottomLeftGUI = new THREE.Mesh(bottomLeftGeometry, materialBL);
bottomLeftGUI.position.x = -1 * guiDistX;
bottomLeftGUI.position.y = -1 * guiDistY;
bottomLeftGUI.position.z = -0.5;
camera.add(bottomLeftGUI);
bottomLeftGUI.material.map.needsUpdate = true;

canvasBL.fillStyle = '#000';
canvasBL.font = "25px Georgia";
canvasBL.fillText("Bottom left GUI", 10, 50);

//------------------End Bottom Left GUI-----------------------//

//--------------------Top Right GUI-------------------------//
const topRightGeometry = new THREE.BoxGeometry( 0.15, 0.15, 0.001);
var canvasTR = document.createElement('canvas').getContext('2d');
canvasTR.canvas.width = 256;
canvasTR.canvas.height = 256;
canvasTR.fillStyle = '#FFF';
canvasTR.fillRect(0, 0, canvasTR.canvas.width, canvasTR.canvas.height);
const textureTR = new THREE.CanvasTexture(canvasTR.canvas);
const materialTR = new THREE.MeshBasicMaterial({
  map: textureTR,
  opacity: 1,
  transparent: true,
});
const topRightGUI = new THREE.Mesh(topRightGeometry, materialTR);
topRightGUI.position.x = guiDistX;
topRightGUI.position.y = guiDistY - 0.1;
topRightGUI.position.z = -0.5;
camera.add(topRightGUI);
topRightGUI.material.map.needsUpdate = true;

canvasTR.fillStyle = '#000';
canvasTR.font = "25px Georgia";
canvasTR.fillText("Leaderboard", 50, 25);


//notifications
const notificationGeomoetry = new  THREE.BoxGeometry( 0.2, 0.02, 0.001);
var canvasNot = document.createElement('canvas').getContext('2d');
canvasNot.canvas.width = 256;
canvasNot.canvas.height = 25.6;
canvasNot.fillStyle = '#FFF';
canvasNot.fillRect(0, 0, canvasNot.canvas.width, canvasNot.canvas.height);
const textureNot = new THREE.CanvasTexture(canvasNot.canvas);
const materialNot = new THREE.MeshBasicMaterial({
  map: textureNot,
  opacity: 0.8,
  transparent: true,
});
const notificationGUI = new THREE.Mesh(notificationGeomoetry, materialNot);
notificationGUI.position.x = 0;
notificationGUI.position.y = -1 * guiDistY + 0.25;
notificationGUI.position.z = -0.2;
camera.add(notificationGUI);
notificationGUI.material.map.needsUpdate = true;

var notificationShown = false;


//----------------Drawing other players in game-----------------------//
//www.youtube.com/watch?v=EkPfhzIbp2g&ab_channel=SimonDev
//mixamo.com
//video for player models
//https://github.com/simondevyoutube/ThreeJS_Tutorial_LoadingModels
let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
light.position.set(20, 100, 10);
light.target.position.set(0, 0, 0);
light.castShadow = true;
//light.shadow.bias = -0.001;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.1;
light.shadow.camera.far = 500.0;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500.0;
light.shadow.camera.left = 100;
light.shadow.camera.right = -100;
light.shadow.camera.top = 100;
light.shadow.camera.bottom = -100;
scene.add(light);

var lightColor = 0xFFFFFF;
var lightIntensity = 2;
light = new THREE.AmbientLight(lightColor,lightIntensity);
scene.add(light);

const loader = new THREE.CubeTextureLoader();
const texture = loader.load([
    './resources/posx.jpg',
    './resources/negx.jpg',
    './resources/posy.jpg',
    './resources/negy.jpg',
    './resources/posz.jpg',
    './resources/negz.jpg',
]);

scene.background = texture;


class MovementControls {
  constructor(params) {
    this._params = params;
  }

  updatePosition(x,y,z) {
    this._params.target.position.x = x;
    this._params.target.position.y = y;
    this._params.target.position.z = z;
  }

  updateDirection(x,y,z) {
    this._params.target.rotation.y = y;//only updates the y direction of other players
  }

  updateDirectionSelf(cameraX,cameraZ){//self model rotates exactly with camera
    this._params.target.position.copy(camera.position);
    this._params.target.rotation.copy(camera.rotation);

    this._params.target.rotation.y = this._params.target.rotation.y + Math.PI;
    this._params.target.rotation.x = -1 * this._params.target.rotation.x;

    this._params.target.updateMatrix();
  }

  Update(timeInSeconds) {
  }
}

class LoadGun {
  constructor(name, x,y,z) {
    this.startX = x;
    this.startY = y;
    this.startZ = z;
    this.name = name;
    this._Initialize();
  }
  _Initialize() {
    this.object;
    this._LoadGunModel();
  }

  _LoadGunModel(){

      var loader = new GLTFLoader();
      loader.load('./models/gun.glb', (gltf) => {
        gltf.scene.scale.setScalar(0.2);
        gltf.scene.traverse(c => {
          c.castShadow = true;
        });
        this.object = gltf.scene;
        const params = {
          target: gltf.scene,
          camera: camera,
        }
        this._controls = new MovementControls(params);//creating controls class that handles movement of object
        gltf.scene.name = this.name;
        scene.add(gltf.scene);
      });

  }

  _UpdatePosition(x,y,z) {
    if (this._controls){
      this._controls.updatePosition(x,y,z);
    }
  }


  _UpdateDirection(x,y,z) {
    if (this._controls){
      this._controls.updateDirection(x,y,z);
    }
  }

  _UpdateDirectionSelf(cameraX,cameraZ){
    if (this._controls){
      this._controls.updateDirectionSelf(cameraX,cameraZ);
    }
  }
}


class LoadPlayerModel {
  constructor(name, x,y,z) {
    this.startX = x;
    this.startY = y;
    this.startZ = z;
    this.name = name;
    this._Initialize();
  }

  _Initialize() {

    this._mixers = [];
    this.object;
    this._previousRAF = null;

    this._LoadAnimatedModel();

    this._RAF();
  }

  _LoadAnimatedModel() {
    const loader = new FBXLoader();//change emmision in blender to change color of gun
    loader.load('./models/ybot.fbx', (fbx) => {
      fbx.scale.setScalar(0.013);
      fbx.traverse(c => {
        c.castShadow = true;
      });
      this.object = fbx;
      const params = {
        target: fbx,
        camera: camera,
      }
      this._controls = new MovementControls(params);//creating controls class that handles movement of object
      fbx.name = this.name;

      const anim = new FBXLoader();
      anim.load('./anims/rifle aiming idle.fbx', (anim) => {
        const m = new THREE.AnimationMixer(fbx);
        this._mixers.push(m);
        const idle = m.clipAction(anim.animations[0]);
        idle.play();
      });
      scene.add(fbx);
      // const materialBR = new THREE.MeshBasicMaterial({
      //   map: textureBR,
      //   opacity: 0.5,
      //   transparent: true,
      // });

      const sphereGeom = new THREE.SphereGeometry( 12, 16, 16 );
      if (showCollisionOutline){//if variable is true spheres created and visible, if not spheres created translucent
        var sphereMat = new THREE.MeshBasicMaterial( {color: 0xffff00, wireframe:true} );
      } else {
        var sphereMat = new THREE.MeshBasicMaterial( {color: 0xffff00, wireframe:true, opacity:0, transparent:true} );
      }
      const sphere1 = new THREE.Mesh( sphereGeom, sphereMat );
      sphere1.position.x = -10;
      sphere1.position.z = -6;
      fbx.add(sphere1);
      this.s1 = sphere1;

      const sphereGeom2 = new THREE.SphereGeometry( 17, 16, 16 );
      const sphere2 = new THREE.Mesh(sphereGeom2, sphereMat);
      sphere2.position.y = -25;
      sphere2.position.z = -10;
      sphere2.position.x = 8;
      fbx.add(sphere2);
      this.s2 = sphere2;

      const sphereGeom3 = new THREE.SphereGeometry( 17, 16, 16 );
      const sphere3 = new THREE.Mesh(sphereGeom3, sphereMat);
      sphere3.position.y = -25;
      sphere3.position.z = -20;
      sphere3.position.x = -10;
      fbx.add(sphere3);
      this.s3 = sphere3;

      const sphereGeom4 = new THREE.SphereGeometry( 17, 16, 16 );
      const sphere4 = new THREE.Mesh(sphereGeom4, sphereMat);
      sphere4.position.y = -45;
      sphere4.position.z = -18;
      sphere4.position.x = 0;
      fbx.add(sphere4);
      this.s4 = sphere4;

      const sphereGeom5 = new THREE.SphereGeometry( 18, 16, 16 );
      const sphere5 = new THREE.Mesh(sphereGeom5, sphereMat);
      sphere5.position.y = -60;
      sphere5.position.z = -16;
      sphere5.position.x = 2;
      fbx.add(sphere5);
      this.s5 = sphere5;

      const sphereGeom6 = new THREE.SphereGeometry( 12, 16, 16 );
      const sphere6 = new THREE.Mesh(sphereGeom6, sphereMat);
      sphere6.position.y = -80;
      sphere6.position.z = -3;
      sphere6.position.x = 11;
      fbx.add(sphere6);
      this.s6 = sphere6;

      const sphereGeom7 = new THREE.SphereGeometry( 12, 16, 16 );
      const sphere7 = new THREE.Mesh(sphereGeom7, sphereMat);
      sphere7.position.y = -80;
      sphere7.position.z = -20;
      sphere7.position.x = -12;
      fbx.add(sphere7);
      this.s7 = sphere7;
    });
  }

  _UpdatePosition(x,y,z) {
    if (this._controls){
      this._controls.updatePosition(x,y,z);
    }
  }

  _Get_S1_Pos(){
    var v3 = new THREE.Vector3();
    this.s1.getWorldPosition(v3);
    return v3;
  }

  _Get_S2_Pos(){
    var v3 = new THREE.Vector3();
    this.s2.getWorldPosition(v3);
    return v3;
  }

  _Get_S3_Pos(){
    var v3 = new THREE.Vector3();
    this.s3.getWorldPosition(v3);
    return v3;
  }

  _Get_S4_Pos(){
    var v3 = new THREE.Vector3();
    this.s4.getWorldPosition(v3);
    return v3;
  }

  _Get_S5_Pos(){
    var v3 = new THREE.Vector3();
    this.s5.getWorldPosition(v3);
    return v3;
  }

  _Get_S6_Pos(){
    var v3 = new THREE.Vector3();
    this.s6.getWorldPosition(v3);
    return v3;
  }

  _Get_S7_Pos(){
    var v3 = new THREE.Vector3();
    this.s7.getWorldPosition(v3);
    return v3;
  }


  _UpdateDirection(x,y,z) {
    if (this._controls){
      this._controls.updateDirection(x,y,z);
    }
  }

  _UpdateDirectionSelf(cameraX,cameraZ){
    if (this._controls){
      this._controls.updateDirectionSelf(cameraX,cameraZ);
    }
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      //this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this._mixers) {
      this._mixers.map(m => m.update(timeElapsedS));
      //this._mixers.parent.position.x += 0.05;
    }
    //console.log(this._mixers.length);

    // if (this._controls) {
    //   this._controls.Update(timeElapsedS);
    // }
  }
}

var selfPlayerModel;
var selfGun;

socket.on('initPlayers', function(players){
  //console.log("creating players");
  for(var i = 0; i < players.length; i++){
      //var cylinder = new THREE.Mesh( geometryCylinder, materialCylinder );
      var box = new THREE.Mesh(geometryPlayerBox,materialBox);
      //console.log("Player position: " + players[i].x + "," +players[i].z);
      box.position.x = players[i].x;
      box.position.y = players[i].y - 1;
      box.position.z = players[i].z;

      OTHER_PLAYER_LIST[players[i].id] = box;
      if(playerBoundingBox){
        scene.add(OTHER_PLAYER_LIST[players[i].id]);
      }

      //if(players[i].id != selfID){
        //console.log("cylinder created at "+OTHER_PLAYER_LIST[other_player_count].position.x + ","+OTHER_PLAYER_LIST[other_player_count].position.z)
        //scene.add(OTHER_PLAYER_LIST[players[i].id]);
        var playerModel = new LoadPlayerModel(players[i].id + "", players[i].x,players[i].y - 1,players[i].z);
        PLAYER_MODEL_LIST[players[i].id] = playerModel;
        var gunModel = new LoadGun(players[i].id + "gun", players[i].x,players[i].y - 1,players[i].z);
        GUN_LIST[players[i].id] = gunModel;
        if(players[i].id == selfID){
          selfPlayerModel = playerModel;
          selfGun = gunModel;
        }

        console.log("Player model added in init players for player " + players[i].id);
      //}
      //console.log("other player count: " + other_player_count );
      //other_player_count = other_player_count + 1;
  }
});
//-------------------End drawing other players---------------------//



var numBlocks = 0;
var blockWidth = 1;
var blockHeight = 1;
//------------------Creating Map With Blocks----------------------//
socket.on('initBlocks', function(blocks){
  for (var i = 0; i < blocks.length; i++){
    var blockGeometry = new THREE.BoxGeometry(blocks[i].width,blocks[i].depth,blocks[i].height);//width,depth,HEIGHT

    // var blockMaterials =
    // [
    //   new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load(blocks[i].imgSides),side: THREE.DoubleSide}),//right side
    //   new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load(blocks[i].imgSides),side: THREE.DoubleSide}),//left side
    //   new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load(blocks[i].imgTop),side: THREE.DoubleSide}),//top side
    //   new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load(blocks[i].imgBottom),side: THREE.DoubleSide}),//bottom side
    //   new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load(blocks[i].imgSides),side: THREE.DoubleSide}),//front side
    //   new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load(blocks[i].imgSides),side: THREE.DoubleSide}),//back side
    // ];//each image corresponds to different side
    var blockMaterials = new THREE.MeshBasicMaterial( {color: blocks[i].color} );

    const wireframeGeometry = new THREE.WireframeGeometry(blockGeometry);
		const wireframeMaterial = new THREE.LineBasicMaterial({color: 0x000000});
		const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
		wireframe.name = 'wireframe';

    //add materials and then add cube
    var block = new THREE.Mesh(blockGeometry, blockMaterials);
    block.add(wireframe);

    block.position.x = blocks[i].x;
    block.position.y = blocks[i].y;
    block.position.z = blocks[i].z;
    BLOCK_LIST[numBlocks] = block;
    scene.add(BLOCK_LIST[numBlocks]);
    //console.log("Block added, block length: " + numBlocks);
    numBlocks = numBlocks + 1;
  }
});

//this function adds a new player to scene when other new player connects
socket.on('newPlayer',function(newPlayer){
  console.log("new player connected with id: " + newPlayer.id);
  var box = new THREE.Mesh( geometryPlayerBox, materialBox );
  box.position.x = newPlayer.x;
  box.position.y = newPlayer.y;
  box.position.z = newPlayer.z;
  OTHER_PLAYER_LIST[newPlayer.id] = box;
  if(playerBoundingBox){
    scene.add(OTHER_PLAYER_LIST[newPlayer.id]);//adding new player to scene
  }
  var playerModel = new LoadPlayerModel(newPlayer.id + "", newPlayer.x,newPlayer.y - 1,newPlayer.z);
  // const sphereGeom = new THREE.SphereGeometry( 0.5, 16, 16 );
  // const sphereMat = new THREE.MeshBasicMaterial( {color: 0xffff00} );
  // const sphere1 = new THREE.Mesh( sphereGeom, sphereMat );
  // playerModel.add(sphere1);
  //scene.add( sphere );
  console.log("Player model added in newPlayer for player " + newPlayer.id);
  PLAYER_MODEL_LIST[newPlayer.id] = playerModel;
  var gunModel = new LoadGun(newPlayer.id + "gun", newPlayer.x,newPlayer.y - 1,newPlayer.z);
  GUN_LIST[newPlayer.id] = gunModel;
});

socket.on('disconnectedPlayer',function(oldPlayer){
  if(playerBoundingBox){
    scene.remove(OTHER_PLAYER_LIST[oldPlayer.id]);
  }
  //console.log("Attempting to remove player with id " + oldPlayer.id);
  var toRemove = scene.getObjectByName(oldPlayer.id + "");
  var toRemoveGun = scene.getObjectByName(oldPlayer.id + "gun");
  scene.remove(toRemove);
  scene.remove(toRemoveGun);
  delete OTHER_PLAYER_LIST[oldPlayer.id];
  delete PLAYER_MODEL_LIST[oldPlayer.id];
  delete GUN_LIST[oldPlayer.id];

});

//end adding stuff to scene


//Function to resize canvas if screen size changes
let resizeCanvas = function(){
  WIDTH = window.innerWidth - 0;//needs - 0 otherwise html loads really slow for some reason
  HEIGHT = window.innerHeight - 0;

  renderer.setSize(WIDTH, HEIGHT);//resetting render image size
  camera.aspect = WIDTH/HEIGHT;//fixing aspect ratio
  camera.updateProjectionMatrix();//updating camera with new aspect ratio

}
resizeCanvas();//resize first time to get correct size

window.addEventListener('resize',function(){//called if canvas size changes
  resizeCanvas();
});

//controls from three
const controls = new THREE.PointerLockControls(camera, document.body);

//This locks the pointer, press esc to unlock
document.addEventListener( 'click', function () {
  controls.lock();//when screen is clicked mouse is locked in to view
});


scene.add(controls.getObject());//adding controls to scene


//This function handles button inputs, will work for WASD or arrows
document.onkeydown  = function ( event ) {//called when keys are pressed
	switch ( event.code ) {
	case 'ArrowUp':
	case 'KeyW':
		moveForward = true;//this will happen if you press w or uparrow
    //selfPlayerModel.updatePosition(camera.position.x,camera.position.y,camera.position.z);
    socket.emit('keyPress', {inputId:'up',state:true});
		break;

	case 'ArrowLeft':
	case 'KeyA':
		moveLeft = true;
    //selfPlayerModel.updatePosition(camera.position.x,camera.position.y,camera.position.z);
    socket.emit('keyPress', {inputId:'left',state:true});
		break;

	case 'ArrowDown':
	case 'KeyS':
		moveBackward = true;
    //selfPlayerModel.updatePosition(camera.position.x,camera.position.y,camera.position.z);
    socket.emit('keyPress', {inputId:'down',state:true});
		break;

	case 'ArrowRight':
	case 'KeyD':
		moveRight = true;
    //selfPlayerModel.updatePosition(camera.position.x,camera.position.y,camera.position.z);
    socket.emit('keyPress', {inputId:'right',state:true});
		break;

	case 'Space':
		if ( canJump === true ) velocityUp = jumpSpeed;
		canJump = false;
		break;

  case 'ShiftLeft':
    sprint = true;
    break;


  case 'KeyR':
    if (!reloading && ammo != magSize){
      reload();
    }
    break;
  }
};

// renderer.addEventListener("mousedown", function (evt) {
//     //socket.emit('keyPress', {inputId:'shoot', state:true});//shoots
//     console.log("success");
// }, false);
var bulletID = 1;
var bulletWidth = 0.05
const bulletGeometry = new THREE.SphereGeometry( bulletWidth, 10, 10 );
const bulletMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} );
var clickFunction = function() {
  //console.log("Bullet Fired");
  if (ammo > 0 && !reloading) {
  var bulletCam = new THREE.PerspectiveCamera(FOV_degrees,WIDTH/HEIGHT,0.1,1000);//create another camera similar to playercam
  bulletCam.rotation.copy(camera.rotation);
  bulletCam.position.copy(camera.position);

  if (bulletID > 14){
    bulletID = 1;
  }
  BULLET_CAM_LIST[bulletID + selfID] = bulletCam;
  const sphere = new THREE.Mesh( bulletGeometry, bulletMaterial );
  scene.add( sphere );
  sphere.position.x = bulletCam.position.x;
  sphere.position.y = bulletCam.position.y;
  sphere.position.z = bulletCam.position.z;
  //sphere.name = "" + bulletID;
  sphere.name = String(bulletID + selfID);
  //console.log("Bullet named: " + sphere.name);

  BULLET_MODEL_LIST[bulletID + selfID] = sphere;

  var data = [];
  var newID = bulletID + selfID;
  data.push({
    id:newID,
    x:sphere.position.x,
    y:sphere.position.y,
    z:sphere.position.z
  });
  socket.emit('newBullet',data);
  bulletID = bulletID + 1;
  ammo = ammo - 1;
} else if (!reloading){
  reload();
}
}
window.onmousedown = clickFunction;

var reloadClock = new THREE.Clock();
var reload = function(){
  reloading = true;
  reloadClock.start();
}


//-------------------Changing bullet collision detection to inside player browser-----------------//

var checkCollisionAllBullets = function () {
  for (var i in BULLET_MODEL_LIST){
    //BULLET_MODEL_LIST[i].name
    var collisionCheckPlayer = checkCollisionBulletPlayersHelper(BULLET_MODEL_LIST[i].position.x,BULLET_MODEL_LIST[i].position.y,BULLET_MODEL_LIST[i].position.z,i);
    if(BULLET_MODEL_LIST[i]){
      checkCollisionBulletBoxesHelper(BULLET_MODEL_LIST[i].position.x,BULLET_MODEL_LIST[i].position.y,BULLET_MODEL_LIST[i].position.z,i);
    }
    // if (collisionCheck != -1){
    //   //socket.emit('playerShot',{playerID:collisionCheck,bulletID:i.name});
    //   console.log("Bullet " + BULLET_MODEL_LIST[i].name + " hit player " + collisionCheck);
    // }
  }
}

var checkCollisionBulletBoxesHelper = function (x,y,z,name) {
  for (var i in BLOCK_LIST){
    if (x >= BLOCK_LIST[i].position.x - (BLOCK_LIST[i].geometry.parameters.width/2)  && x <= BLOCK_LIST[i].position.x + (BLOCK_LIST[i].geometry.parameters.width/2)  &&
        y >= BLOCK_LIST[i].position.y - (BLOCK_LIST[i].geometry.parameters.height/2) && y <= BLOCK_LIST[i].position.y + (BLOCK_LIST[i].geometry.parameters.height/2) &&
        z >= BLOCK_LIST[i].position.z - (BLOCK_LIST[i].geometry.parameters.depth/2)  && z <= BLOCK_LIST[i].position.z + (BLOCK_LIST[i].geometry.parameters.depth/2)) {
          socket.emit('removeBulletSend',{bulletID:name});//collision with block detected
          //makeSphere(x,y,z);
          //console.log("Bullet collision with block");
        }
  }
}

//This function creates a sphere at x,y,z, used in testing bullet collision
var makeSphere = function (x,y,z) {
  const redSphereGeom = new THREE.SphereGeometry( bulletWidth, 10, 10 );
  const redSphereMaterial = new THREE.MeshBasicMaterial( {color: 0xff0000} );
  const sphere = new THREE.Mesh( redSphereGeom, redSphereMaterial );
  scene.add( sphere );
  sphere.position.x = x;
  sphere.position.y = y;
  sphere.position.z = z;
  //sphere.name = "" + bulletID;
  //sphere.name = String(bulletID + selfID);
}

//clock used to make sure you dont get multiple kills for shooting same person once
var killClock = new THREE.Clock();
var lastKilled = 0;
var timeChange = 0;
var killCheckTime = 2;//how long you have to wait to kill somebody again

var playerDist;
var checkCollisionBulletPlayersHelper = function (x,y,z,name){
  var lowDist = 100;
  for (var i in OTHER_PLAYER_LIST){

    //console.log(OTHER_PLAYER_LIST[i].position.x)
    playerDist = distanceTwoPoints(x,y,z,OTHER_PLAYER_LIST[i].position.x,OTHER_PLAYER_LIST[i].position.y,OTHER_PLAYER_LIST[i].position.z);
    //console.log("dist: " + playerDist);
    if (playerDist < lowDist){
      lowDist = playerDist;
    }
    if (i != selfID){
      if (playerDist < 1.5){//add collision detection points here, as of now it is just 0.5 distance from camera
        //console.log("Collision between bullet " + name + " and player " + i);
        var shot = closeCheckBulletPlayer(x,y,z,i);
        if (shot){
          timeChange = killClock.getDelta();
          if ((i == lastKilled && timeChange > killCheckTime) || i != lastKilled){
            socket.emit('playerShot', {bulletID:name,killedID:i,killerID:selfID});
            removeSelfBullet(name);
            lastKilled = i;
          }
        }
        //console.log("Shot player with bullet " + name);
        return i;
      }
    }
  }

  if (lowDist > 50){
    socket.emit('removeBulletSend',{bulletID:name});
    //console.log("Bullet " + name + " removed for distance");
  }
  return -1;
}

//removing bullet after shooting someone to prevent multiple hit detections
var removeSelfBullet = function(name){
  var bulletID = String(name);
  var bulletObject = scene.getObjectByName(bulletID);
  // if (bulletObject){
  //   console.log("Found bullet");
  // } else {
  //   console.log("couldnt find bullet");
  // }
  scene.remove(bulletObject);

  delete BULLET_CAM_LIST[bulletID];
  delete BULLET_MODEL_LIST[bulletID];
}

//Widths
// s1: 12 -> .156
// s2: 17 -> .221
// s3: 17 -> .221
// s4: 17 -> .221
// s5: 18 -> .234
// s6: 12 -> .156
// s7: 12 -> .156
//Scale: 0.013

var closeCheckBulletPlayer = function(x,y,z,playerID){
  var p = PLAYER_MODEL_LIST[playerID];
  var v3 = p._Get_S1_Pos();
  var dist = distanceTwoPoints(x,y,z,v3.x,v3.y,v3.z);

  if (dist <= 0.2){
    return true;
  }

  v3 = p._Get_S2_Pos();
  var dist = distanceTwoPoints(x,y,z,v3.x,v3.y,v3.z);

  if (dist <= 0.221){
    return true;
  }

  v3 = p._Get_S3_Pos();
  var dist = distanceTwoPoints(x,y,z,v3.x,v3.y,v3.z);

  if (dist <= 0.221){
    return true;
  }

  v3 = p._Get_S4_Pos();
  var dist = distanceTwoPoints(x,y,z,v3.x,v3.y,v3.z);

  if (dist <= 0.221){
    return true;
  }

  v3 = p._Get_S5_Pos();
  var dist = distanceTwoPoints(x,y,z,v3.x,v3.y,v3.z);

  if (dist <= 0.234){
    return true;
  }

  v3 = p._Get_S6_Pos();
  var dist = distanceTwoPoints(x,y,z,v3.x,v3.y,v3.z);

  if (dist <= 0.2){
    return true;
  }

  v3 = p._Get_S7_Pos();
  var dist = distanceTwoPoints(x,y,z,v3.x,v3.y,v3.z);

  if (dist <= 0.2){
    return true;
  }



}

//-------------------Changing bullet collision detection to inside player browser-----------------//





socket.on('newBulletPlayer',function(data){
  const sphere = new THREE.Mesh( bulletGeometry, bulletMaterial );
  scene.add( sphere );
  sphere.position.x = data.x;
  sphere.position.y = data.y;
  sphere.position.z = data.z;
  sphere.name = String(data[0].id);//need some way to remove bullets when collidied
  //console.log("bullet created with name " + sphere.name);
  ENEMY_BULLET_LIST[data[0].id] = sphere;
});

socket.on('removeBullet',function(data){
  var bulletID = String(data[0].id);
  var bulletObject = scene.getObjectByName(bulletID);
  // if (bulletObject){
  //   console.log("Found bullet");
  // } else {
  //   console.log("couldnt find bullet");
  // }
  scene.remove(bulletObject);

  delete BULLET_CAM_LIST[bulletID];
  delete BULLET_MODEL_LIST[bulletID];
});


//called when keys are released, sets bools to false and stops movement
document.onkeyup = function ( event ) {
  switch ( event.code ) {
	   case 'ArrowUp':
	   case 'KeyW':
		   moveForward = false;
       //socket.emit('keyPress', {inputId:'up',state:false});
		   break;

	   case 'ArrowLeft':
	   case 'KeyA':
		   moveLeft = false;
       //socket.emit('keyPress', {inputId:'left',state:false});
		   break;

	   case 'ArrowDown':
	   case 'KeyS':
		   moveBackward = false;
       //socket.emit('keyPress', {inputId:'down',state:false});
		   break;

	   case 'ArrowRight':
	   case 'KeyD':
	     moveRight = false;
       //socket.emit('keyPress', {inputId:'right',state:false});
		   break;

     case 'ShiftLeft':
       sprint = false;
       break;
	 }

};


//------------------Main Drawing Loop----------------//
var target = new THREE.Vector3();//used to save camera direction
var oldX = 0;
var oldY = 0;

var number1 = "";
var number1Kills = 0;
var number2 = "";
var number2Kills = 0;
var number3 = "";
var number3Kills = 0;

var numPlayers = 0;

var vecRight = new THREE.Vector3();
var vecForward = new THREE.Vector3();

var vecX = new THREE.Vector3();
var vecZ = new THREE.Vector3();

var selfDirection;

socket.on('gameLoop', function(data){


  //console.log("test");
  //updating position of other players in game
  for(var i = 0; i < data.length; i++){
    if (data[i].type == 'Player'){
    //console.log("setting player " + i + " position to " + data[i].x + "," + data[i].z);
    //console.log("recieved " + data[i].x + " for player " + data[i].id);
    if(OTHER_PLAYER_LIST[data[i].id].position.x != data[i].x){
      //console.log("Player " + data[i].id + " Moved from " + OTHER_PLAYER_LIST[data[i].id].position.x + " to " + data[i].x);
      OTHER_PLAYER_LIST[data[i].id].position.x = data[i].x;
    }
    if(OTHER_PLAYER_LIST[data[i].id].position.y != data[i].y){
        OTHER_PLAYER_LIST[data[i].id].position.y = data[i].y - 1;
    }
    if (OTHER_PLAYER_LIST[data[i].id].position.z != data[i].z){
      OTHER_PLAYER_LIST[data[i].id].position.z = data[i].z;
    }
    if(PLAYER_MODEL_LIST[data[i].id]){
      PLAYER_MODEL_LIST[data[i].id]._UpdatePosition(data[i].x, data[i].y, data[i].z);
      PLAYER_MODEL_LIST[data[i].id]._UpdateDirection(data[i].cameraX,data[i].cameraY,data[i].cameraZ);
      if(data[i].id == selfID){
        selfDirection = data[i].cameraY;
        PLAYER_MODEL_LIST[data[i].id]._UpdateDirectionSelf(data[i].cameraX,data[i].cameraZ);
      }
    }
    if(GUN_LIST[data[i].id]){
      GUN_LIST[data[i].id]._UpdatePosition(data[i].x, data[i].y, data[i].z);
      GUN_LIST[data[i].id]._UpdateDirection(data[i].cameraX,data[i].cameraY,data[i].cameraZ);
      if(data[i].id == selfID){
        selfDirection = data[i].cameraY;
        GUN_LIST[data[i].id]._UpdateDirectionSelf(data[i].cameraX,data[i].cameraZ);
      }
    }
  }
  }

  //loop through bullet
  for(var i = 0; i < data.length; i++){
    if (data[i].type == 'Bullet'){
      //console.log("Bullet " + i);
      if (ENEMY_BULLET_LIST[data[i].id]){
        //console.log("Bullet Found");
        ENEMY_BULLET_LIST[data[i].id].position.x = data[i].x;
        ENEMY_BULLET_LIST[data[i].id].position.y = data[i].y;
        ENEMY_BULLET_LIST[data[i].id].position.z = data[i].z;
      }
    }
  }

  for(var i = 0; i < data.length; i++){
    if (data[i].type == 'top3'){
      number1 = data[i].number1;
      number1Kills = data[i].number1Kills;
      number2 = data[i].number2;
      number2Kills = data[i].number2Kills;
      number3 = data[i].number3;
      number3Kills = data[i].number3Kills;
      numPlayers = data[i].playerCount;
    }
  }


  if (sprint){
    playerSpeed = 0.15;
  } else {
    playerSpeed = 0.1;
  }


  //clock.start();
//------------------------This section handles player movement------------------------------//
  direction.z = Number( moveForward ) - Number( moveBackward );//1 if move forward, -1 if move backward
	direction.x = Number( moveRight ) - Number( moveLeft );//1 if move right, -1 if move left
  direction.normalize(); // this ensures consistent movements in all directions

  //find right vector
  vecRight.setFromMatrixColumn( camera.matrix, 0 );
  vecX.x = vecRight.x;
  vecZ.z = vecRight.z;


  //timerCounter = timerCounter + 1;

  //right movement
  camera.position.addScaledVector(vecX,playerSpeed * direction.x);
  if (checkCollisionPlayerSideBlocks()){
    camera.position.addScaledVector(vecX,-1 * playerSpeed * direction.x);
  }

  camera.position.addScaledVector(vecZ,playerSpeed * direction.x);
  if (checkCollisionPlayerSideBlocks()){
    camera.position.addScaledVector(vecZ,-1 * playerSpeed * direction.x);

  }


  //Find forward vector
  vecForward.setFromMatrixColumn( camera.matrix, 0 );

  vecForward.crossVectors( camera.up, vecForward);

  vecX.x = vecForward.x;
  vecZ.z = vecForward.z;


  camera.position.addScaledVector(vecX,playerSpeed * direction.z);
  if (checkCollisionPlayerSideBlocks()){
    camera.position.addScaledVector(vecX,-1 * playerSpeed * direction.z);
  }

  camera.position.addScaledVector(vecZ,playerSpeed * direction.z);
  if (checkCollisionPlayerSideBlocks()){
    camera.position.addScaledVector(vecZ,-1 * playerSpeed * direction.z);
  }



  //gravity
  velocityUp = velocityUp - gravSpeed;
  camera.position.y = camera.position.y + velocityUp;
  if(checkCollisionPlayerTopBlocks(camera.position.x,camera.position.y,camera.position.z)){
    camera.position.y = camera.position.y - velocityUp;
    velocityUp = 0;
  }

  if (camera.position.y < 1) {
    camera.position.y = 1;
    canJump = true;
  }

  if (camera.position.x > 50){
    camera.position.x = 50;
  }
  if (camera.position.x < -50){
    camera.position.x = -50;
  }
  if (camera.position.z > 50){
    camera.position.z = 50;
  }
  if (camera.position.z < -50){
    camera.position.z = -50;
  }
  //----------------------End player movement------------------------//

  if(selfPlayerModel){
    selfPlayerModel._UpdatePosition(camera.position.x, camera.position.y,  camera.position.z);
  }

  if(selfGun){
    selfGun._UpdatePosition(camera.position.x, camera.position.y,  camera.position.z);
  }




  updateBullets();
  sendPlayerInfo();
  sendBulletInfo();
  updateGUI();
  checkReload();
  //update();
  render();

});
//---------------End of main drawing loop----------------------//

var updateBullets = function (){
  updateBulletsHelper(20);
}

var checkReload = function(){
  if (reloading){
    var curTime = reloadClock.getElapsedTime();
    if (curTime > 3){
      reloading = false;
      reloadClock.stop();
      ammo = magSize;
    }
  }
}

var updateBulletsHelper = function(split){
  var step = bulletSpeed / split;
  for (var i = 1; i <= split; i++){
    for (var b = 1; b < bulletID; b++){
      if(BULLET_CAM_LIST[b + selfID]){
        BULLET_CAM_LIST[b + selfID].translateZ(-1 * bulletSpeed * step);
        BULLET_MODEL_LIST[b + selfID].position.x = BULLET_CAM_LIST[b + selfID].position.x;
        BULLET_MODEL_LIST[b + selfID].position.y = BULLET_CAM_LIST[b + selfID].position.y;
        BULLET_MODEL_LIST[b + selfID].position.z = BULLET_CAM_LIST[b + selfID].position.z;
      }
    }
    checkCollisionAllBullets();
  }
}

//Send player info to server
var sendPlayerInfo = function(){
  var data = [];
  //camera.getWorldDirection(target);//direction is copied into vector "target"
  const euler = new THREE.Euler();
  const rotation = euler.setFromQuaternion(camera.quaternion);

  var vector = new THREE.Vector3();
  camera.getWorldDirection(vector);

  var theta = Math.atan2(vector.x,vector.z);


  // const radians = rotation.z > 0
  //   ? rotation.z
  //   : (2 * Math.PI) + rotation.z;
  var decimal_places = 6;
  var posX = camera.position.x;
  var stringPositionX = posX.toFixed(decimal_places);
  posX = parseFloat(stringPositionX);

  var posY = camera.position.y;
  var stringPositionY = posY.toFixed(decimal_places);
  posY = parseFloat(stringPositionY);

  var posZ = camera.position.z;
  var stringPositionZ = posZ.toFixed(decimal_places);
  posZ = parseFloat(stringPositionZ);
  //console.log("send player X: " + posX);
  data.push({
    cameraX:rotation.x,
    cameraY:theta,
    cameraZ:rotation.z,
    playerX:posX,
    playerY:posY,
    playerZ:posZ,
    kills:kills
  });
  socket.emit('selfMoveInfo',data);
};

var sendBulletInfo = function (){
  var data = [];

  for (var i = 1; i < bulletID; i++){
    if(BULLET_CAM_LIST[i + selfID]){
      var bID = parseFloat(BULLET_MODEL_LIST[i + selfID].name);
      //console.log("sending bullet id as " + bID);
      data.push({
        x:BULLET_CAM_LIST[i + selfID].position.x,
        y:BULLET_CAM_LIST[i + selfID].position.y,
        z:BULLET_CAM_LIST[i + selfID].position.z,
        name:BULLET_MODEL_LIST[i + selfID].name,
        id:bID
      });
    }
  }
  socket.emit('bulletInfo',data);
}

socket.on('bulletCollision',function(data) {//send from server when someone gets hit by bullet
  var bulletID = parseFloat(data.bulletName);
  //console.log("Comparing " + selfID + " to " + data.playerID);
  if (selfID == data.playerID){//current player has been killed
    //console.log("Killed by player: " + data.killerID);
    selfKilled(data.killerName);
  }
  if (selfID == data.killerID){
    //console.log("Killed player: " + data.playerID);
    killNotification(data.killedName);
    kills = kills + 1;
  }

});

var selfKilled = function(killerName){
  respawn();
  deathNotification(killerName);
  deaths = deaths + 1;
  ammo = 7;
}

var deathNotification = function(killerName) {
  notificationShown = true;
  canvasNot.fillStyle = '#000';
  canvasNot.font = "10px Georgia";
  notifClock.stop();
  notifClock.start();
  // canvasNot.clearRect(0,0,canvasNot.canvas.width,canvasNot.canvas.height);
  canvasNot.fillRect(0,0,canvasNot.canvas.width,canvasNot.canvas.height);
  canvasNot.fillStyle = '#ffffff';
  canvasNot.fillText("You were killed by " + killerName,30,15);
  notificationGUI.material.map.needsUpdate = true;
}

var killNotification = function(killedName) {
  notificationShown = true;
  canvasNot.fillStyle = '#000';
  canvasNot.font = "10px Georgia";
  notifClock.stop();
  notifClock.start();
  // canvasNot.clearRect(0,0,canvasNot.canvas.width,canvasNot.canvas.height);
  canvasNot.fillRect(0,0,canvasNot.canvas.width,canvasNot.canvas.height);
  canvasNot.fillStyle = '#ffffff';
  canvasNot.fillText("You killed " + killedName,15,15);
  notificationGUI.material.map.needsUpdate = true;

}

var respawn = function(){
  var randX = (Math.random() * 80) - 40;
  var randZ = (Math.random() * 80) - 40;
  camera.position.y = 80;
  camera.position.x = randX;
  camera.position.z = randZ;
}

respawn();

//game logic
var update = function(){
  OTHER_PLAYER_LIST[selfID].position.x = camera.position.x;
  OTHER_PLAYER_LIST[selfID].position.y = camera.position.y - 1;
  OTHER_PLAYER_LIST[selfID].position.z = camera.position.z;

};

var checkCollisionPlayerSideBlocks = function(){
  var playerX = camera.position.x;
  var playerY = camera.position.y;
  var playerZ = camera.position.z;

  for (var i = 0; i < numBlocks; i++){
    var curBlockWidth = BLOCK_LIST[i].geometry.parameters.width;
    var curBlockHeight = BLOCK_LIST[i].geometry.parameters.height;
    var curBlockDepth = BLOCK_LIST[i].geometry.parameters.depth;

    var topBound = BLOCK_LIST[i].position.y + (curBlockHeight/2);
    var bottomBound = topBound - curBlockHeight;

    if ((playerY <= topBound && playerY > bottomBound) || (playerY -2  <= topBound && playerY - 2 > bottomBound) || (BLOCK_LIST[i].position.y > playerY -2 && BLOCK_LIST[i].position.y < playerY)) {
      //if (playerY-2 <= topBound && playerY-2 > bottomBound){
      if (playerX - 0.25 < BLOCK_LIST[i].position.x + (curBlockWidth/2) &&
       playerX + 0.25 > BLOCK_LIST[i].position.x - (curBlockWidth/2) &&
       playerZ -0.25 < BLOCK_LIST[i].position.z + (curBlockDepth/2) &&
       playerZ + 0.25 > BLOCK_LIST[i].position.z - (curBlockDepth/2)) {
        return true;
      }
    }
  }
  return false;
}

var checkCollisionPlayerTopBlocks = function(playerX,playerY,playerZ) {

  for (var i = 0; i < numBlocks; i++){
    var curBlockWidth = BLOCK_LIST[i].geometry.parameters.width;
    var curBlockHeight = BLOCK_LIST[i].geometry.parameters.height;
    var curBlockDepth = BLOCK_LIST[i].geometry.parameters.depth;

    //console.log("Width: " + curBlockWidth + " Height: " + curBlockHeight + " Depth: " + curBlockDepth);

    // var topBound = BLOCK_LIST[i].position.y + 0.5;
    var topBound = BLOCK_LIST[i].position.y + (curBlockHeight/2);
    var bottomBound = topBound - (curBlockHeight);
    var rightBound = BLOCK_LIST[i].position.x + (curBlockWidth/2);
    var leftBound = rightBound - curBlockWidth;
    var forwardBound = BLOCK_LIST[i].position.z + (curBlockDepth/2);
    var backBound = forwardBound - curBlockDepth;

    if (playerY <= topBound && playerY > bottomBound && playerZ < forwardBound && playerZ > backBound && playerX < rightBound && playerX > leftBound){
      return true;//top of player hit block
    }

    if (playerY-2 <= topBound && playerY-2 > bottomBound){
      if (playerX - 0.25 < BLOCK_LIST[i].position.x + (curBlockWidth/2) &&
        playerX + 0.25 > BLOCK_LIST[i].position.x - (curBlockWidth/2) &&
        playerZ -0.25 < BLOCK_LIST[i].position.z + (curBlockDepth/2) &&
        playerZ + 0.25 > BLOCK_LIST[i].position.z - (curBlockDepth/2)) {
          canJump = true;
          return true;//bottom of player hit top of block
        }
    }
  }
  return false;
}


var distanceTwoPoints = function(x1,y1,z1,x2,y2,z2){
  var sum = Math.pow((x1-x2),2) + Math.pow((y1-y2),2) + Math.pow((z1-z2),2);
  var dist = Math.sqrt(sum);
  return dist;
}

//draw scene
var render = function() {
  renderer.render(scene,camera);
};


canvasBR.fillStyle = '#000';
canvasBR.font = "30px Georgia";

canvasBL.fillStyle = '#000';
canvasBL.font = "30px Georgia";

var notifClock = new THREE.Clock();


var updateGUI = function(){
  //bottom left GUI here
  canvasBL.font = "30px Georgia";
  canvasBL.clearRect(0,0,canvasBL.canvas.width, canvasBL.canvas.height);
  canvasBL.fillStyle = '#ffffff';
  canvasBL.fillRect(0, 0, canvasBL.canvas.width, canvasBL.canvas.height);
  canvasBL.fillStyle = '#000';
  var textBL = "Kills: " + kills;
  canvasBL.fillText(textBL, 150, 30);
  var textBL2 = "Deaths: " + deaths;
  canvasBL.fillText(textBL2,117,65);
  canvasBL.font = '20px Georgia';
  var textBL3 = "Current Players: " + numPlayers;
  canvasBL.fillText(textBL3,80,95);

  bottomLeftGUI.material.map.needsUpdate = true;

  //bottom right gui here
  canvasBR.clearRect(0,0,canvasBR.canvas.width, canvasBR.canvas.height);
  canvasBR.fillStyle = '#ffffff';
  canvasBR.fillRect(0, 0, canvasBR.canvas.width, canvasBR.canvas.height);
  var infHexCode = 0x221E; //or &#8734;
  canvasBR.fillStyle = '#000';
  var textBR = "Ammo: " + ammo + " / " + String.fromCharCode(infHexCode);
  canvasBR.fillText(textBR, 10, 30);


   // var c= 169; // 0xA9
   // context.fillText(String.fromCharCode(c), 100, 100);
   cube.material.opacity = 1;
   cube2.material.opacity = 1;
   cube3.material.opacity = 1;
   cube4.material.opacity = 1;


  if (reloading){
    canvasBR.fillText("RELOADING ",10, 60);
    canvasBR.fillRect(10,70,180,20);
    canvasBR.fillStyle = '#00c402';
    var percent = reloadClock.getElapsedTime() / reloadTime;
    var distFill = percent * 170;
    canvasBR.fillRect(15,75,distFill,10);
    cube.material.opacity = 0.1;
    cube2.material.opacity = 0.1;
    cube3.material.opacity = 0.1;
    cube4.material.opacity = 0.1;
    //canvasBR.fillText(reloadClock.getElapsedTime() + " / " + reloadTime, 10, 80);
  }
  bottomRightGUI.material.map.needsUpdate = true;


  if (notificationShown){
    if (notifClock.getElapsedTime() > 3){
      canvasNot.clearRect(0,0,canvasNot.canvas.width,canvasNot.canvas.height);
      notificationGUI.material.map.needsUpdate = true;
      notificationShown = false;
      notifClock.stop();
    }
  } else {
    canvasNot.clearRect(0,0,canvasNot.canvas.width,canvasNot.canvas.height);
    notificationGUI.material.map.needsUpdate = true;
  }

  canvasTR.clearRect(0,0,canvasTR.canvas.width,canvasTR.canvas.height);
  canvasTR.fillStyle = '0x000000';
  canvasTR.font = '28px Georgia';
  canvasTR.fillText("Leaderboard", 50, 25);
  canvasTR.fillRect(55,30,150,5);

  if (number1 != ""){
    canvasTR.fillText("1." + number1 + ": " + number1Kills, 20, 65);
    //console.log("number 1 is " + number1);
  }
  if (number2 != ""){
    canvasTR.fillText("2." + number2 + ": " + number2Kills, 20, 105);
    //console.log("number 1 is " + number1);
  }
  if (number3 != ""){
    canvasTR.fillText("3." + number3 + ": " + number3Kills, 20, 145);
    //console.log("number 1 is " + number1);
  }
  topRightGUI.material.map.needsUpdate = true;





}
