//Script that controls what happens player side
/*
Will Loughlin

Each player recieves a copy of this file on connection.
Movement is handled here and position is relayed to app.js server file
Everytime gameloop is called this file recieves position and direction of each other player
*/

//Width and height of screen, will be changed when screen is sized
var WIDTH = 500;
var HEIGHT = 500;

//View FOV
var FOV_degrees = 60;

var OTHER_PLAYER_LIST = {};

var speed = 0.05;
var height = 1;

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
  speed = playerID.spd;
  height = playerID.hgt;
});


//adding stuff to scene
var cubeMaterials =
[
  new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('client/img/1.jpg'),side: THREE.DoubleSide}),//right side
  new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('client/img/2.jpg'),side: THREE.DoubleSide}),//left side
  new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('client/img/3.jpg'),side: THREE.DoubleSide}),//top side
  new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('client/img/4.jpg'),side: THREE.DoubleSide}),//bottom side
  new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('client/img/5.jpg'),side: THREE.DoubleSide}),//front side
  new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('client/img/6.jpg'),side: THREE.DoubleSide}),//back side
];//each image corresponds to different side

//create a material,color, or image texture
//var material = new THREE.MeshBasicMaterial({color: 0xFFFFFF,wireframe:true});
var material = new THREE.MeshFaceMaterial(cubeMaterials);//call with image array
var cube = new THREE.Mesh(geometry,material);//creating cube
scene.add(cube);//adding cube to 3d scene

camera.position.z = 3;//initialize camera position
camera.position.y = height;



const geometryCylinder = new THREE.CylinderGeometry( 0.25, 0.25, height, 32 );
const materialCylinder = new THREE.MeshBasicMaterial( {color: 0xffff00} );
//cylinder = new THREE.Mesh( geometry, material );


//----------------Drawing other players in game-----------------------//
socket.on('initPlayers', function(players){
  //console.log("creating players");
  for(var i = 0; i < players.length; i++){
      if(players[i].id == selfID){
        indexSelf = i;//finding player index
      }
      var cylinder = new THREE.Mesh( geometryCylinder, materialCylinder );
      //console.log("Player position: " + players[i].x + "," +players[i].z);
      cylinder.position.x = players[i].x;
      cylinder.position.y = players[i].y;
      cylinder.position.z = players[i].z;
      OTHER_PLAYER_LIST[players[i].id] = cylinder;
      if(players[i].id != selfID){
        //console.log("cylinder created at "+OTHER_PLAYER_LIST[other_player_count].position.x + ","+OTHER_PLAYER_LIST[other_player_count].position.z)
        scene.add(OTHER_PLAYER_LIST[players[i].id]);
      }
      //console.log("other player count: " + other_player_count );
      //other_player_count = other_player_count + 1;
  }
});
//-------------------End drawing other players---------------------//

//this function adds a new player to scene when other new player connects
socket.on('newPlayer',function(newPlayer){
  console.log("new player connected with id: " + newPlayer.id);
  var newcylinder = new THREE.Mesh( geometryCylinder, materialCylinder );
  newcylinder.position.x = newPlayer.x;
  newcylinder.position.y = newPlayer.y;
  newcylinder.position.z = newPlayer.z;
  OTHER_PLAYER_LIST[newPlayer.id] = newcylinder;
  scene.add(OTHER_PLAYER_LIST[newPlayer.id]);//adding new player to scene
});

socket.on('disconnectedPlayer',function(oldPlayer){
  scene.remove(OTHER_PLAYER_LIST[oldPlayer.id]);
  delete OTHER_PLAYER_LIST[oldPlayer.id];
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
    socket.emit('keyPress', {inputId:'right',state:true});
		break;

	case 'ArrowLeft':
	case 'KeyA':
		moveLeft = true;
    socket.emit('keyPress', {inputId:'left',state:true});
		break;

	case 'ArrowDown':
	case 'KeyS':
		moveBackward = true;
    socket.emit('keyPress', {inputId:'down',state:true});
		break;

	case 'ArrowRight':
	case 'KeyD':
		moveRight = true;
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

socket.on('gameLoop', function(data){

  //updating position of other players in game
  for(var i = 0; i < data.length; i++){
    if (data[i].isPlayer){
      //console.log("setting player " + i + " position to " + data[i].x + "," + data[i].z);
      //console.log("recieved " + data[i].x + " for player " + data[i].id);
      if(OTHER_PLAYER_LIST[data[i].id].position.x != data[i].x){
        //console.log("Player " + data[i].id + " Moved from " + OTHER_PLAYER_LIST[data[i].id].position.x + " to " + data[i].x);
        OTHER_PLAYER_LIST[data[i].id].position.x = data[i].x;
      }
      if(OTHER_PLAYER_LIST[data[i].id].position.y != data[i].y){
        OTHER_PLAYER_LIST[data[i].id].position.y = data[i].y;
      }
      if (OTHER_PLAYER_LIST[data[i].id].position.z != data[i].z){
        OTHER_PLAYER_LIST[data[i].id].position.z = data[i].z;
      }
    }
  }


  direction.z = Number( moveForward ) - Number( moveBackward );//1 if move forward, -1 if move backward
	direction.x = Number( moveRight ) - Number( moveLeft );//1 if move right, -1 if move left
  direction.normalize(); // this ensures consistent movements in all directions

  controls.moveRight(speed * direction.x);
  controls.moveForward(speed * direction.z);

  sendPlayerInfo();
  update();
  render();

});
//---------------End of main drawing loop----------------------//

//Send player info to server
var sendPlayerInfo = function(){
  var data = [];
  camera.getWorldDirection(target);//direction is copied into vector "target"
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
    cameraX:target.x,
    cameraY:target.y,
    playerX:posX,
    playerY:posY,
    playerZ:posZ
  });
  socket.emit('selfMoveInfo',data);
};

//game logic
var update = function(){
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.005;
};

//draw scene
var render = function() {
  renderer.render(scene,camera);
};
