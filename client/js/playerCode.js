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

//View FOV
var FOV_degrees = 60;

//These store each player and block
var OTHER_PLAYER_LIST = {};
var PLAYER_MODEL_LIST = {};
var GUN_LIST = {};
var BLOCK_LIST = {};

//These get updated from the Server on connection
var playerSpeed = 0.05;
var playerHeight = 2;

var playerModelOffsetX = 0;
var playerModelOffsetY = 0;
var playerModelOffsetZ = 0;

//var playerModelOffsetForward = -0.3;
var playerModelOffsetForward = 0;
var playerModelOffsetRight = 0;

//These variables used for movement
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

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
var indexSelf = 0;


//Getting player's self ID
socket.on('setID', function(playerID){
  selfID = playerID.id;
  console.log("New ID Set to: " + selfID);
  playerSpeed = playerID.spd;
  playerHeight = playerID.hgt;
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

camera.position.z = 3;//initialize camera position
camera.position.y = playerHeight + (playerHeight * 0.5);
camera.rotation.order = "YXZ";

const geometryCylinder = new THREE.CylinderGeometry( 0.5, 0.5, 2, 32 );
const materialCylinder = new THREE.MeshBasicMaterial( {color: 0x336BFF, wireframe:true} );
//cylinder = new THREE.Mesh( geometry, material );


//----------------Drawing other players in game-----------------------//
//www.youtube.com/watch?v=EkPfhzIbp2g&ab_channel=SimonDev
//mixamo.com
//video for player models
//https://github.com/simondevyoutube/ThreeJS_Tutorial_LoadingModels
let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
light.position.set(20, 100, 10);
light.target.position.set(0, 0, 0);
light.castShadow = true;
light.shadow.bias = -0.001;
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
    './client/resources/posx.jpg',
    './client/resources/negx.jpg',
    './client/resources/posy.jpg',
    './client/resources/negy.jpg',
    './client/resources/posz.jpg',
    './client/resources/negz.jpg',
]);
scene.background = texture;


//change emmision to change color
//GLTF Model loading
/*
function LoadGLTFModel(){
  var loader = new GLTFLoader();
  loader.load('./client/models/gun4.glb', (gltf) => {
    gltf.scene.traverse(c => {
      c.castShadow = true;
    });
    scene.add(gltf.scene);
  });
}

LoadGLTFModel();
*/

const clock = new THREE.Clock();

class BasicCharacterControls {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._move = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this._velocity = new THREE.Vector3(0, 0, 0);

    //document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    //document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  updatePosition(x,y,z) {
    this._params.target.position.x = x + playerModelOffsetX;
    this._params.target.position.y = y + playerModelOffsetY;
    this._params.target.position.z = z + playerModelOffsetZ;
  }

  updateDirection(x,y,z) {
    //var dir = new THREE.Vector3(0,x,0);
    //console.log("X: " + x);
    //this._params.target.rotation.x = y;
    this._params.target.rotation.y = y;

    var theta = -1 * y + Math.PI / 2;
    var newXoffset = playerModelOffsetForward * Math.cos(theta);
    this._params.target.position.x = this._params.target.position.x + newXoffset;

    var newZoffset = playerModelOffsetForward * Math.sin(theta);
    this._params.target.position.z = this._params.target.position.z + newZoffset;

    //this._params.target.rotation.z = z;
    //.rotation.set(0,x,0);
  }

  updateDirectionSelf(cameraX,cameraZ){
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
      loader.load('./client/models/gun.glb', (gltf) => {
        gltf.scene.scale.setScalar(0.2);
        gltf.scene.traverse(c => {
          c.castShadow = true;
        });
        this.object = gltf.scene;
        const params = {
          target: gltf.scene,
          camera: camera,
        }
        this._controls = new BasicCharacterControls(params);//creating controls class that handles movement of object
        gltf.scene.name = this.name;
        scene.add(gltf.scene);
        console.log("test gun added");
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

//console.log("beginning gun add");
//var testGun = new LoadGun("test name", 2,2,2);


class LoadModelDemo {
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
    const loader = new FBXLoader();
    loader.load('./client/models/ybot.fbx', (fbx) => {
      fbx.scale.setScalar(0.013);
      fbx.traverse(c => {
        c.castShadow = true;
      });
      this.object = fbx;
      const params = {
        target: fbx,
        camera: camera,
      }
      this._controls = new BasicCharacterControls(params);//creating controls class that handles movement of object
      fbx.name = this.name;

      const anim = new FBXLoader();
      anim.load('./client/anims/rifle aiming idle.fbx', (anim) => {
        const m = new THREE.AnimationMixer(fbx);
        this._mixers.push(m);
        const idle = m.clipAction(anim.animations[0]);
        idle.play();
      });
      scene.add(fbx);
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

//var loadedModel = new LoadModelDemo(0,0,0);

var selfPlayerModel;
var selfGun;

socket.on('initPlayers', function(players){
  //console.log("creating players");
  for(var i = 0; i < players.length; i++){
      if(players[i].id == selfID){
        indexSelf = i;//finding player index
      }
      var cylinder = new THREE.Mesh( geometryCylinder, materialCylinder );
      //console.log("Player position: " + players[i].x + "," +players[i].z);
      cylinder.position.x = players[i].x;
      cylinder.position.y = players[i].y - 1;
      cylinder.position.z = players[i].z;
      OTHER_PLAYER_LIST[players[i].id] = cylinder;
      scene.add(OTHER_PLAYER_LIST[players[i].id]);

      //if(players[i].id != selfID){
        //console.log("cylinder created at "+OTHER_PLAYER_LIST[other_player_count].position.x + ","+OTHER_PLAYER_LIST[other_player_count].position.z)
        //scene.add(OTHER_PLAYER_LIST[players[i].id]);
        var playerModel = new LoadModelDemo(players[i].id + "", players[i].x,players[i].y - 1,players[i].z);
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

//------------------Creating Map With Blocks----------------------//
socket.on('initBlocks', function(blocks){
  for (var i = 0; i < blocks.length; i++){
    var blockGeometry = new THREE.BoxGeometry(blocks[i].width,blocks[i].height,blocks[i].height);//width,depth,HEIGHT
    var blockMaterials =
    [
      new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load(blocks[i].imgSides),side: THREE.DoubleSide}),//right side
      new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load(blocks[i].imgSides),side: THREE.DoubleSide}),//left side
      new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load(blocks[i].imgTop),side: THREE.DoubleSide}),//top side
      new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load(blocks[i].imgBottom),side: THREE.DoubleSide}),//bottom side
      new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load(blocks[i].imgSides),side: THREE.DoubleSide}),//front side
      new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load(blocks[i].imgSides),side: THREE.DoubleSide}),//back side
    ];//each image corresponds to different side

    //add materials and then add cube
    var block = new THREE.Mesh(blockGeometry, blockMaterials);
    block.position.x = blocks[i].x;
    block.position.y = blocks[i].y;
    block.position.z = blocks[i].z;
    scene.add(block);
  }
});

//this function adds a new player to scene when other new player connects
socket.on('newPlayer',function(newPlayer){
  console.log("new player connected with id: " + newPlayer.id);
  var newcylinder = new THREE.Mesh( geometryCylinder, materialCylinder );
  newcylinder.position.x = newPlayer.x;
  newcylinder.position.y = newPlayer.y;
  newcylinder.position.z = newPlayer.z;
  OTHER_PLAYER_LIST[newPlayer.id] = newcylinder;
  scene.add(OTHER_PLAYER_LIST[newPlayer.id]);//adding new player to scene
  var playerModel = new LoadModelDemo(newPlayer.id + "", newPlayer.x,newPlayer.y - 1,newPlayer.z);
  console.log("Player model added in newPlayer for player " + newPlayer.id);
  PLAYER_MODEL_LIST[newPlayer.id] = playerModel;
  var gunModel = new LoadGun(newPlayer.id + "gun", newPlayer.x,newPlayer.y - 1,newPlayer.z);
  GUN_LIST[newPlayer.id] = gunModel;
});

socket.on('disconnectedPlayer',function(oldPlayer){
  scene.remove(OTHER_PLAYER_LIST[oldPlayer.id]);
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
		if ( canJump === true ) velocity.y += 350;
		canJump = false;
		break;
	}
};

//called when keys are released, sets bools to false and stops movement
document.onkeyup = function ( event ) {
  switch ( event.code ) {
	   case 'ArrowUp':
	   case 'KeyW':
		   moveForward = false;
       socket.emit('keyPress', {inputId:'up',state:false});
		   break;

	   case 'ArrowLeft':
	   case 'KeyA':
		   moveLeft = false;
       socket.emit('keyPress', {inputId:'left',state:false});
		   break;

	   case 'ArrowDown':
	   case 'KeyS':
		   moveBackward = false;
       socket.emit('keyPress', {inputId:'down',state:false});
		   break;

	   case 'ArrowRight':
	   case 'KeyD':
	     moveRight = false;
       socket.emit('keyPress', {inputId:'right',state:false});
		   break;
	 }
};


//------------------Main Drawing Loop----------------//
var target = new THREE.Vector3();//used to save camera direction
var oldX = 0;
var oldY = 0;

var selfDirection;

socket.on('gameLoop', function(data){
  //console.log("test");
  //updating position of other players in game
  for(var i = 0; i < data.length; i++){
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
      PLAYER_MODEL_LIST[data[i].id]._UpdatePosition(data[i].x + playerModelOffsetX, data[i].y + playerModelOffsetY, data[i].z + playerModelOffsetZ);
      PLAYER_MODEL_LIST[data[i].id]._UpdateDirection(data[i].cameraX,data[i].cameraY,data[i].cameraZ);
      if(data[i].id == selfID){
        selfDirection = data[i].cameraY;
        PLAYER_MODEL_LIST[data[i].id]._UpdateDirectionSelf(data[i].cameraX,data[i].cameraZ);
      }
    }
    if(GUN_LIST[data[i].id]){
      GUN_LIST[data[i].id]._UpdatePosition(data[i].x + playerModelOffsetX, data[i].y + playerModelOffsetY, data[i].z + playerModelOffsetZ);
      GUN_LIST[data[i].id]._UpdateDirection(data[i].cameraX,data[i].cameraY,data[i].cameraZ);
      if(data[i].id == selfID){
        selfDirection = data[i].cameraY;
        GUN_LIST[data[i].id]._UpdateDirectionSelf(data[i].cameraX,data[i].cameraZ);
      }
    }

  }


  direction.z = Number( moveForward ) - Number( moveBackward );//1 if move forward, -1 if move backward
	direction.x = Number( moveRight ) - Number( moveLeft );//1 if move right, -1 if move left
  direction.normalize(); // this ensures consistent movements in all directions

  controls.moveRight(playerSpeed * direction.x);
  controls.moveForward(playerSpeed * direction.z);

  //console.log("direction z: " + direction.z + " direction x: " + direction.x)
  //console.log(" ")

  if(selfPlayerModel){
    selfPlayerModel._UpdatePosition(camera.position.x + playerModelOffsetX, camera.position.y + playerModelOffsetY,  camera.position.z + playerModelOffsetZ);
    //selfPlayerModel._UpdateDirection(0,selfDirection,0);
  }

  if(selfGun){
    selfGun._UpdatePosition(camera.position.x + playerModelOffsetX, camera.position.y + playerModelOffsetY,  camera.position.z + playerModelOffsetZ);
  }

  sendPlayerInfo();
  update();
  render();

});
//---------------End of main drawing loop----------------------//

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
    playerZ:posZ
  });
  socket.emit('selfMoveInfo',data);
};

//game logic
var update = function(){
  OTHER_PLAYER_LIST[selfID].position.x = camera.position.x + playerModelOffsetX;
  OTHER_PLAYER_LIST[selfID].position.y = camera.position.y + playerModelOffsetY;
  OTHER_PLAYER_LIST[selfID].position.z = camera.position.z + playerModelOffsetZ;

};

//draw scene
var render = function() {
  renderer.render(scene,camera);
};
