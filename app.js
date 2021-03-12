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
function Block(id, x, y, z, type, width, height, imgSides, imgTop, imgBottom){
  Thing.call(this, id, x, y, z, type);//inheriting from thing
  this.width = width;
  this.height = height;
  this.imgSides = imgSides;
  this.imgTop = imgTop;
  this.imgBottom = imgBottom;
}

//This code allows Block to use member functions of Thing object
Block.prototype = Object.create(Thing.prototype);
Object.defineProperty(Block.prototype, 'constructor', {
  value: Player,
  enumerable: false,
  writable: true
});


//Creating Map
//var block1 = new Block(1,1,0,1,"Block", 1, 1, "client/img/1.jpg", "client/img/1.jpg", "client/img/1.jpg");
//BLOCK_LIST[1] = block1;

//var block2 = new Block(2,2,0,2,"Block", 1, 1, "client/img/1.jpg", "client/img/1.jpg", "client/img/1.jpg");
//BLOCK_LIST[2] = block2;

var counter = 1;
for (var i = -2; i < 3; i++){
  for(var j = -2; j < 3; j++){
    var block = new Block(counter,i,0,j,"Block", 1, 1, "client/img/1.jpg", "client/img/hardwood_floor.jpg", "client/img/1.jpg");
    BLOCK_LIST[counter] = block;
    counter++;
  }
}


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
      width:block.width,
      imgSides:block.imgSides,
      imgTop:block.imgTop,
      imgBottom:block.imgBottom,
      type:block.type
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

  /*
    This function recieves keypress information from the user
  */
  socket.on('keyPress',function(data){//called when player presses a key
    if(data.inputId === 'left'){
      player.pressingLeft = data.state;
    } else if (data.inputId === 'right'){
      player.pressingRight = data.state;
    } else if (data.inputId === 'up'){
      player.pressingUp = data.state;
    } else if (data.inputId === 'down'){
      player.pressingDown = data.state;
    } else if (data.inputId === 'jump'){
      player.verticalUp = data.state;
    } else if (data.inputId === 'shift'){
      player.verticalDown = data.state;
    }
  });
});


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
        height:player.height,
        width:player.width,
        type:player.type,
        pressingRight:player.pressingRight,
        pressingLeft:player.pressingLeft,
        pressingUp:player.pressingUp,
        pressingDown:player.pressingDown
      });
  }

  // for (var i in BLOCK_LIST){
  //   var block = BLOCK_LIST[i];
  //   pack.push({
  //     id:block.id,
  //     x:block.x,
  //     y:block.y,
  //     z:block.z,
  //     height:block.height,
  //     width:block.width,
  //     imgSides:block.imgSides,
  //     imgTop:block.imgTop,
  //     imgBottom:block.imgBottom,
  //     type:block.type
  //   });
  // }

  // for (var i in POINT_LIST){
  //   var point = POINT_LIST[i];
  //   pack.push({
  //     x:point.x,
  //     y:point.y,
  //     z:point.z,
  //     isPoint:true,
  //     isPlayer:false,
  //     isBlock:false
  //   });
  // }

  for (var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i];
    socket.emit('gameLoop',pack);
  }
}, 1000/100);
