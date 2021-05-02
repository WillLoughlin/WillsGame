//---------This code here used to set up Express (send index.html file to client)----------//
var PORT = process.env.PORT || 2000;
var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

serv.listen(PORT,function(){
  console.log('Server Started')
});
//--------------End of express setup code----------------//

//How to update game on heroku app:
//git add .
//git commit -m "commit notes"
//git push heroku master
//git push origin master

//var THREE = require('./client/js/three.js');

/*
These lists used to store players and sockets
*/
var SOCKET_LIST = {};//this list used to access socket connections
var PLAYER_LIST = {};//this list used to store each player object
var BLOCK_LIST = {};
var BULLET_LIST = {};

//this info sent to player on connection
var playerSpeed = 0.05;
var playerHeight = 2;



// var blockWidth = 100;
// var blockHeight = 100;
// var numBlocks = 0;
// var numPoints = 0;//3d

//var direction = new THREE.Vector3();//used to save player x,z

/*
var Player = function(id){
  var self = {
    x:0,
    y:0,
    z:0,
    id:id,
    name:"Will",
    cameraX:0,
    cameraY:0,
    pressingRight:false,
    pressingLeft:false,
    pressingUp:false,
    pressingDown:false
  }
  return self;
}
*///old player object

/*
This is the Thing Object
All other objects in the game inherit position, id, and type variables from the thing object
*/
function Thing(id, x, y, z, type){
  this.id = id;
  this.x = x;
  this.y = y;
  this.z = z;
  this.type = type;//string used to determine what thing is
}

/*
This is the Player Object
It stores all information about current player
id is used to identify player in lists
*/
function Player(id, x, y, z, type, name){
  Thing.call(this, id, x, y, z, type);//inheriting id,x,y,z,type from Thing object
  this.name = name;
  this.cameraX = 0;
  this.cameraY = 0;
  this.pressingRight = false;
  this.pressingLeft = false;
  this.pressingUp = false;
  this.pressingDown = false;
}//to add member functions go to https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Inheritance
//wierd stuff with prototype keyword

//This section of code allows the inherited Player object to use the prototype functions from the Thing object
Player.prototype = Object.create(Thing.prototype);
Object.defineProperty(Player.prototype, 'constructor', {
  value: Player,
  enumerable: false,
  writable: true
});


/*
This is the Block object
It is used to create the blocks that make up the map
It inherits x,y,x,id,type from Thing object
*/
function Block(id, x, y, z, type, width, depth, height, imgSides, imgTop, imgBottom, color){
  Thing.call(this, id, x, y, z, type);//inheriting from thing
  this.width = width;
  this.height = height;
  this.depth = depth;
  this.imgSides = imgSides;
  this.imgTop = imgTop;
  this.imgBottom = imgBottom;
  this.color = color;
}

//This code allows Block to use member functions of Thing object
Block.prototype = Object.create(Thing.prototype);
Object.defineProperty(Block.prototype, 'constructor', {
  value: Block,
  enumerable: false,
  writable: true
});


//bullet object
function Bullet(idSelf,idOwner, x,y,z,type){
  Thing.call(this,idSelf,x,y,z,type);
  this.idSelf = idSelf;
  this.idOwner = idOwner;
}

Bullet.prototype = Object.create(Thing.prototype);
Object.defineProperty(Bullet.prototype, 'constructor', {
  value: Bullet,
  enumerable: false,
  writable: true
});


//Creating Map
//var block1 = new Block(1,1,0,1,"Block", 1, 1, "client/img/1.jpg", "client/img/1.jpg", "client/img/1.jpg");
//BLOCK_LIST[1] = block1;

//var block2 = new Block(2,2,0,2,"Block", 1, 1, "client/img/1.jpg", "client/img/1.jpg", "client/img/1.jpg");
//BLOCK_LIST[2] = block2;

// var block1 = new Block(1,1,0,1,"Block",10,10,"client/img/wood2.jpeg", "client/img/hardwood_floor.jpg", "client/img/wood2.jpeg");
//BLOCK_LIST[1] = block1;
//id, x, y, z, type, width, height, imgSides, imgTop, imgBottom){


//should be -4 and 5


//making floor
var counter = 1;
var floorColor = 0xaf7f2e;
var floor = new Block(counter,0,0,0,"Block", 100, 1, 100, "client/img/wood2.jpeg", "client/img/hardwood_floor.jpg", "client/img/wood2.jpeg",floorColor);
BLOCK_LIST[counter] = floor;



//------Boundary Walls-----//
counter++;
var wallColor = 0x9fa0a0;
var leftWall = new Block(counter,-50,2.5, 0,"Block",0.25,4,100,"","","",wallColor);
BLOCK_LIST[counter] = leftWall;

counter++;
var rightWall = new Block(counter,50,2.5, 0,"Block",0.25,4,100,"","","",wallColor);
BLOCK_LIST[counter] = rightWall;

counter++;
var frontWall = new Block(counter,0,2.5,-50,"Block",100,4,0.25,"","","",wallColor);
BLOCK_LIST[counter] = frontWall;

counter++;
var backWall = new Block(counter,0,2.5,50,"Block",100,4,0.25,"","","",wallColor);
BLOCK_LIST[counter] = backWall;


//--------Back Right Pipe--------//
counter++;
var pipeColor = 0xae9f9f;
var pipeBR1 = new Block(counter,34,1,30,"Block",3,1,1,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBR1;

counter++;
var pipeBR2 = new Block(counter,34,2,29,"Block",3,1,1,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBR2;

counter++;
var pipeBR3 = new Block(counter,34,3,28,"Block",3,1,1,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBR3;

counter++;
var pipeBR4 = new Block(counter,34,4,27,"Block",3,1,1,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBR4;

counter++;
var pipeBR5 = new Block(counter,34,5,26,"Block",3,1,1,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBR5;

counter++;
var pipeBRMain = new Block(counter,34,5,0.5,"Block",3,1,50,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBRMain;

counter++;
var pipeBRTurn = new Block(counter,42.5,5,-23,"Block",14,1,3,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBRTurn;

counter++;
var pipeBREnd = new Block(counter,48,5,-37,"Block",3,1,25,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBREnd;

counter++;
var pipeBR6 = new Block(counter,46,4,-48,"Block",1,1,3,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBR6;

counter++;
var pipeBR7 = new Block(counter,45,3,-48,"Block",1,1,3,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBR7;

counter++;
var pipeBR8 = new Block(counter,44,2,-48,"Block",1,1,3,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBR8;

counter++;
var pipeBR9 = new Block(counter,43,1,-48,"Block",1,1,3,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBR9;

//var tower = new Block(counter,-5,15.5,-5,"Block",6,25,6,"","","",towerColor);

counter++;
var pipeBR10 = new Block(counter,32,6,5,"Block",1,1,3,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBR10;

counter++;
var pipeBR11 = new Block(counter,31,7,5,"Block",1,1,3,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBR11;

counter++;
var pipeBRConnect = new Block(counter,14.5,8,5,"Block",32,1,3,"","","",pipeColor);
BLOCK_LIST[counter] = pipeBRConnect;
//------End Pipe BR-------------//

//------Big Box BR---------//
counter++;
var bigBoxBRColor = 0x4d7f4f;
var bigBoxBR = new Block(counter,18,3,22,"Block",10,6,10,"","","",bigBoxBRColor);
BLOCK_LIST[counter] = bigBoxBR;

//------Center Tower----------//
//x,y,z
counter++;
var towerColor = 0x424141;
var tower = new Block(counter,-5,15.5,0,"Block",6,30,6,"","","",towerColor);
BLOCK_LIST[counter] = tower;

counter++;
var towerSide = new Block(counter,20,5,0,"Block",6,12,4,"","","",towerColor);
BLOCK_LIST[counter] = towerSide;

counter++;
var towerConnect = new Block(counter,7,1.25,-1.5,"Block",20,1.5,1,"","","",towerColor);
BLOCK_LIST[counter] = towerConnect;

var towerFloorColor = 0x939291;
counter++;
var towerPlatform1 = new Block(counter,-3,8.75,-3,"Block",16,0.5,19,"","","",towerFloorColor);
BLOCK_LIST[counter] = towerPlatform1;

counter++;
var towerPlatform2 = new Block(counter,1.5,15,-8,"Block",7,0.5,10,"","","",towerFloorColor);
BLOCK_LIST[counter] = towerPlatform2;

counter++;
var towerPlatform3 = new Block(counter,-5,15,-5.5,"Block",6,0.5,5,"","","",towerFloorColor);
BLOCK_LIST[counter] = towerPlatform3;

//------Middle Pipe----------//

counter++;
var middlePipe1 = new Block(counter,-4, 14,-10,"Block",1,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe1;

counter++;
var middlePipe2 = new Block(counter,-5, 13,-10,"Block",1,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe2;

counter++;
var middlePipe3 = new Block(counter,-6, 12,-10,"Block",1,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe3;

counter++;
var middlePipe4 = new Block(counter,-7, 11,-10,"Block",1,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe4;

counter++;
var middlePipe5 = new Block(counter,-9.5, 10,-10,"Block",4,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe5;

counter++;
var middlePipe6 = new Block(counter,-12, 9,-10,"Block",1,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe6;

counter++;
var middlePipe7 = new Block(counter,-13, 8,-10,"Block",1,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe7;

counter++;
var middlePipe8 = new Block(counter,-14, 7,-10,"Block",1,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe8;

counter++;
var middlePipe9 = new Block(counter,-15, 6,-10,"Block",1,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe9;

counter++;
var middlePipe10 = new Block(counter,-16, 5,-10,"Block",1,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe10;

counter++;
var middlePipe11 = new Block(counter,-17, 4,-10,"Block",1,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe11;

counter++;
var middlePipe12 = new Block(counter,-18, 3,-10,"Block",1,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe12;

counter++;
var middlePipe13 = new Block(counter,-19, 2,-10,"Block",1,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe13;

counter++;
var middlePipe14 = new Block(counter,-20, 1,-10,"Block",1,1,2,"","","",pipeColor);
BLOCK_LIST[counter] = middlePipe14;

//------Front right building----------//
counter++;
var buildingFLColor = 0x555656;
var buildingFL1 = new Block(counter,40, 6,-40,"Block",6,12,6,"","","", buildingFLColor);
BLOCK_LIST[counter] = buildingFL1;

counter++;
var buildingFL2 = new Block(counter,36, 3,-32,"Block",14,6,10,"","","", buildingFLColor);
BLOCK_LIST[counter] = buildingFL2;

//-----right side boxes-------//

counter++;
var rightBoxColor = 0xa89784;
var rightBox1 = new Block(counter,43, 2,-15,"Block",4,4,4,"","","", rightBoxColor);
BLOCK_LIST[counter] = rightBox1;

counter++;
var rightBox2 = new Block(counter,43, 2,0,"Block",4,4,4,"","","", rightBoxColor);
BLOCK_LIST[counter] = rightBox2;

counter++;
var rightBox3 = new Block(counter,43, 2,15,"Block",4,4,4,"","","", rightBoxColor);
BLOCK_LIST[counter] = rightBox3;

//blue container

var bContainerColor = 0x565482;
counter++;
var bContainer = new Block(counter,5, 2.5,-44,"Block",15,4,4,"","","", bContainerColor);
BLOCK_LIST[counter] = bContainer;

counter++;
var bContainer2 = new Block(counter,5, 4.25,-48,"Block",15,0.5,4,"","","", bContainerColor);
BLOCK_LIST[counter] = bContainer2;

counter++;
var coverBContainer = new Block(counter,20, 2,-40,"Block",2,3,2,"","","", rightBoxColor);
BLOCK_LIST[counter] = coverBContainer;

counter++;
var coverBContainer2 = new Block(counter,25, 2,-38,"Block",2,3,2,"","","", rightBoxColor);
BLOCK_LIST[counter] = coverBContainer2;

//red container
var rContainerColor = 0xdb4e42;
counter++;
var rContainer = new Block(counter,5, 2.5, 48,"Block",15,4,4,"","","", rContainerColor);
BLOCK_LIST[counter] = rContainer;

counter++;
var rContainer2 = new Block(counter,5, 4.25,44,"Block",15,0.5,4,"","","", rContainerColor);
BLOCK_LIST[counter] = rContainer2;

counter++;
var rContainer3 = new Block(counter,5, 2.5, 41.75,"Block",15,4,0.5,"","","", rContainerColor);
BLOCK_LIST[counter] = rContainer3;


counter++;
var rContainer4 = new Block(counter,-4, 1.5, 41.75,"Block",3,2,0.5,"","","", rContainerColor);
BLOCK_LIST[counter] = rContainer4;

//oil container back left
var containerBLColor = 0xdbdbdb;
counter++;
var containerBL = new Block(counter,-20, 2, 41.75,"Block",12,4,3,"","","", containerBLColor);
BLOCK_LIST[counter] = containerBL;

//building BL

var buildingBLColor = 0xc8b125;
counter++;
var buildingBL = new Block(counter,-40, 2, 35,"Block",12,10,18,"","","", buildingBLColor);
BLOCK_LIST[counter] = buildingBL;

//left middle building
var buildingLMColor = 0xc86a41;
counter++;
var buildingLM = new Block(counter,-47.5, 2.5, 10,"Block",5,4,15,"","","", buildingLMColor);
BLOCK_LIST[counter] = buildingLM;


counter++;
var buildingLM2 = new Block(counter,-43, 4.25, 3,"Block",4,0.5,11,"","","", buildingLMColor);
BLOCK_LIST[counter] = buildingLM2;

counter++;
var buildingLM3 = new Block(counter,-47.5, 4.25, 0,"Block",5,0.5,5,"","","", buildingLMColor);
BLOCK_LIST[counter] = buildingLM3;

counter++;
var buildingLM4 = new Block(counter,-41.25, 2, 3,"Block",0.5,4,11,"","","", buildingLMColor);
BLOCK_LIST[counter] = buildingLM4;

counter++;
var buildingLM5 = new Block(counter,-43.5, 2, -2.25,"Block",5,4,0.5,"","","", buildingLMColor);
BLOCK_LIST[counter] = buildingLM5;

//left side boxes
counter++;
var leftBoxColor = 0xd0bfa1;
var leftBox1 = new Block(counter,-41.5, 1, -8,"Block",2,2,2,"","","", leftBoxColor);
BLOCK_LIST[counter] = leftBox1;

counter++;
var leftBox2 = new Block(counter,-38, 1, -12,"Block",2,2,2,"","","", leftBoxColor);
BLOCK_LIST[counter] = leftBox2;

counter++;
var leftBox3 = new Block(counter,-39, 1.25, -38,"Block",2,1.5,2,"","","", leftBoxColor);
BLOCK_LIST[counter] = leftBox3;

counter++;
var leftBox4 = new Block(counter,-39, 1.75, -36,"Block",2,2.5,2,"","","", leftBoxColor);
BLOCK_LIST[counter] = leftBox4;

counter++;
var leftBox5 = new Block(counter,-15, 1.75, -43,"Block",2,2.5,2,"","","", leftBoxColor);
BLOCK_LIST[counter] = leftBox5;

counter++;
var leftBox6 = new Block(counter,-13, 1.25, -43,"Block",2,1.5,2,"","","", leftBoxColor);
BLOCK_LIST[counter] = leftBox6;

counter++;
var leftBox7 = new Block(counter,-25, 1.25, -41,"Block",4,1.5,2,"","","", leftBoxColor);
BLOCK_LIST[counter] = leftBox7;




//front left container
counter++;
var containerFLColor = 0xede4e4;
var containerFL = new Block(counter,-36, 2, -32,"Block",4,4,15,"","","", containerFLColor);
BLOCK_LIST[counter] = containerFL;


/*
var counter = 1;
for (var i = -30; i < 30; i++){
  for(var j = -30; j < 30; j++){
    var block = new Block(counter,i,0,j,"Block", 1, 1, "client/img/wood2.jpeg", "client/img/hardwood_floor.jpg", "client/img/wood2.jpeg");
    BLOCK_LIST[counter] = block;
    counter++;
  }
}

for (var i = 5; i < 7; i++){
  for(var j = 3; j < 15; j++){
    var block = new Block(counter,i,0,j,"Block", 1, 1, "client/img/wood2.jpeg", "client/img/hardwood_floor.jpg", "client/img/wood2.jpeg");
    BLOCK_LIST[counter] = block;
    counter++;
  }
}

BLOCK_LIST[counter] = new Block(counter, 0, 1, 0, "Block",1,1,"client/img/bricks1.jpg", "client/img/4.jpg", "client/img/bricks1.jpg");
counter++;
BLOCK_LIST[counter] = new Block(counter, 1, 2, 0, "Block",1,1,"client/img/bricks1.jpg", "client/img/4.jpg", "client/img/bricks1.jpg");
counter++;
BLOCK_LIST[counter] = new Block(counter, 2, 3, 0, "Block",1,1,"client/img/bricks1.jpg", "client/img/4.jpg", "client/img/bricks1.jpg");
counter++;
BLOCK_LIST[counter] = new Block(counter, 3, 4, 0, "Block",1,1,"client/img/bricks1.jpg", "client/img/4.jpg", "client/img/bricks1.jpg");
counter++;
BLOCK_LIST[counter] = new Block(counter, 4, 5, 0, "Block",1,1,"client/img/bricks1.jpg", "client/img/4.jpg", "client/img/bricks1.jpg");

*/








//Socket.io used for multiplayer functionality
var io = require('socket.io')(serv,{});

/*
This function handles all connections and disconnections
When a player connects all other player information is sent to new player,
and new player information is sent to all other players.
When a player disconnects the id is sent to all other players to remove from OTHER_PLAYER_LIST

Anthing within this function is either called on connection or disconnection
*/
io.sockets.on('connection', function(socket){//called when player connects with server
  socket.id = Math.random();//getting random number between 0-1 for player id
  SOCKET_LIST[socket.id] = socket;//adding player socket to list

  var player = new Player(socket.id, 0, 0, 0, "Player", "Will");//creating player with socket id
  console.log("New Player with ID: " + socket.id);//printing connection with id to console
  PLAYER_LIST[socket.id] = player;//adding new player to PLAYER_LIST

  SOCKET_LIST[socket.id].emit('setID', {id:socket.id, spd:playerSpeed, hgt:playerHeight});//Sending player's id to itself, stored in selfID in playerCode.js

  //this sends all other player information to new player just connected
  var playerPack = [];
  for (var i in PLAYER_LIST){//loop through each player
      var player = PLAYER_LIST[i];
      playerPack.push({
        name:player.name,
        x:player.x,
        y:player.y,
        z:player.z,
        id:player.id
      });//adding each player position and view direction to pack
  }
  SOCKET_LIST[socket.id].emit('initPlayers', playerPack);//sending other player information to new player

  var blockPack = [];
  for (var i in BLOCK_LIST){
    var block = BLOCK_LIST[i];
    blockPack.push({
      id:block.id,
      x:block.x,
      y:block.y,
      z:block.z,
      height:block.height,
      depth:block.depth,
      width:block.width,
      imgSides:block.imgSides,
      imgTop:block.imgTop,
      imgBottom:block.imgBottom,
      type:block.type,
      color:block.color
    });
  }
  SOCKET_LIST[socket.id].emit('initBlocks',blockPack);//sending block infmormation to new player

  //now we send new player information to all other new players
  for(var i in SOCKET_LIST) {
    if(i != socket.id){//this makes sure it doesnt send single new player info to the newly connected player (they get all info from initPlayers)
      SOCKET_LIST[i].emit('newPlayer',{id:socket.id,x:player.x,y:player.y,z:player.z,name:player.name});//player is new player, sending information to all others
    }
  }

  /*
  This function alerts all players when someone disconnects so they
  can be removed from scene
  */
  socket.on('disconnect',function(){//called when player disconnects from server
    console.log("Player Disconnected with ID: " + socket.id);//printing player disconnect info to console
    for(var i in SOCKET_LIST) {
      if(i != socket.id){//this sends player disconnection info to all players
        SOCKET_LIST[i].emit('disconnectedPlayer',{id:socket.id});//sending disconnect information to all others
      }
    }
    delete SOCKET_LIST[socket.id];//deleting player's socket from list
    delete PLAYER_LIST[socket.id];//delete player from list
  });


  /*
  This function recieves player position and direction information from each player every cycle of gameloop
  */
  socket.on('selfMoveInfo',function(data){
    //console.log("Server recived X: " + data[0].playerX + " for player " + player.id);
    player.cameraX = data[0].cameraX;
    player.cameraY = data[0].cameraY;
    player.cameraZ = data[0].cameraZ;
    player.x = data[0].playerX;
    player.y = data[0].playerY;
    player.z = data[0].playerZ;
  });

  socket.on('newBullet',function(data){
    var bullet = new Bullet(data[0].id,player.id,data[0].x,data[0].y,data[0].z,'Bullet');
    BULLET_LIST[bullet.id] = bullet;
    for(var i in SOCKET_LIST){
      if(PLAYER_LIST[i].id != player.id){
        SOCKET_LIST[i].emit('newBulletPlayer',data);
      }
    }
  });

var bulletThresholdDistance = 50;

  socket.on('bulletInfo',function(data){
    //collision detection happens here

    var newData = [];
    for (var i in data){
      //var id = parseInt(data[i].name);
      if(BULLET_LIST[data[i].id]){
      BULLET_LIST[data[i].id].x = data[i].x;
      BULLET_LIST[data[i].id].y = data[i].y;
      BULLET_LIST[data[i].id].z = data[i].z;
    }

      // var idCollision = checkCollisionBulletPlayers(data[i].x,data[i].y,data[i].z,data[i].id,player.id);
      // if (idCollision != -1){//collision detected with data[i] bullet and player with idCollision
      //   console.log("collision detected, Bullet: " + data[i].name + " Player: " + idCollision);
      //   newData.push({
      //     bulletName:data[i].name,
      //     bulletX:data[i].x,
      //     bulletY:data[i].y,
      //     bulletZ:data[i].z,
      //     playerID:idCollision,
      //     killerID:player.id
      //   });
      //
      //   for (var s in SOCKET_LIST){
      //     SOCKET_LIST[s].emit('bulletCollision',newData);
      //     //console.log("Bullet removed for collision");
      //     removeBulletFromServer(data[i].name);
      //   }
      //   //socket.emit('bulletCollision',newData);
      // }
    }
  });

  //-------new collision bullets--------------//

  //playerCode will send this when bullet collision detected with other player
  socket.on('playerShot', function(data){
    //console.log("Player " + data.killedID + " killed by " + data.killerID + " with bullet " + data.bulletID);
    for (var s in SOCKET_LIST){
      SOCKET_LIST[s].emit('bulletCollision', {bulletName:data.bulletID,playerID:data.killedID,killerID:data.killerID});
    }

    removeBulletFromServer(data.bulletID);
    //first kill player hit
  });

  //playerCode will send this when it wants to remove a bullet from the server
  socket.on('removeBulletSend', function(data){
    removeBulletFromServer(data.bulletID);
  });



  //---------end new collision-------------//

  /*
    This function recieves keypress information from the user
  */
  // socket.on('keyPress',function(data){//called when player presses a key
  //   if(data.inputId === 'left'){
  //     player.pressingLeft = data.state;
  //   } else if (data.inputId === 'right'){
  //     player.pressingRight = data.state;
  //   } else if (data.inputId === 'up'){
  //     player.pressingUp = data.state;
  //   } else if (data.inputId === 'down'){
  //     player.pressingDown = data.state;
  //   } else if (data.inputId === 'jump'){
  //     player.verticalUp = data.state;
  //   } else if (data.inputId === 'shift'){
  //     player.verticalDown = data.state;
  //   }
  // });
});

/*//This is old code from when the collision detection was handled by the server, very laggy had to move to browser side
var playerDist;

var checkCollisionBulletPlayers = function (x,y,z,name,selfID){
  var lowDist = 100;
  for (var i in PLAYER_LIST){
    playerDist = distanceTwoPoints(x,y,z,PLAYER_LIST[i].x,PLAYER_LIST[i].y,PLAYER_LIST[i].z);
    if (playerDist < lowDist){
      lowDist = playerDist;
    }
    if (PLAYER_LIST[i].id != selfID){
      if (playerDist < 0.5){//add collision detection points here, as of now it is just 0.5 distance from camera
        console.log("Collision between bullet " + name + " and player " + PLAYER_LIST[i].id);
        return PLAYER_LIST[i].id;
      }
    }
  }
  if (lowDist > 50){
    removeBulletFromServer(name);
    //console.log("Bullet " + name + " removed for distance");
  }
  return -1;
}

var distanceTwoPoints = function(x1,y1,z1,x2,y2,z2){
  var sum = Math.pow((x1-x2),2) + Math.pow((y1-y2),2) + Math.pow((z1-z2),2);
  var dist = Math.sqrt(sum);
  return dist;
}
*/

var removeBulletFromServer = function(name){
  var bulletID = [];
  bulletID.push({id:name});
  for (var s in SOCKET_LIST){
    SOCKET_LIST[s].emit('removeBullet',bulletID);
  }
  if (BULLET_LIST[name]){
    //console.log("Bullet " + name + " found and removed.");
  } else {
    //console.log("Cannot find bullet" + name);
  }
  delete BULLET_LIST[name];
}






/*
  This is the gameloop function
  It runs on the interval 1000/100 at the end of the function
  This sends all player information to each player
*/
setInterval(function(){//game loop
  var pack = [];//pack to transfer data
  for (var i in PLAYER_LIST){
    //console.log("added player " + PLAYER_LIST[i].id + " with x: "+ PLAYER_LIST[i].x + " to pack");
      var player = PLAYER_LIST[i];
      pack.push({
        x:player.x,
        y:player.y,
        z:player.z,
        id:player.id,
        cameraX:player.cameraX,
        cameraY:player.cameraY,
        cameraZ:player.cameraZ,
        name:player.name,
        type:'Player'
      });
  }

  for (var i in BULLET_LIST){
    var bullet = BULLET_LIST[i];
    pack.push({
      x:bullet.x,
      y:bullet.y,
      z:bullet.z,
      id:bullet.id,
      type:'Bullet'
    })
  }

  for (var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i];
    socket.emit('gameLoop',pack);
  }
}, 1000/100);
