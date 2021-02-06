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

//var THREE = require('./client/js/three.js');

/*
These lists used to store players and sockets
*/
var SOCKET_LIST = {};//this list used to access socket connections
var PLAYER_LIST = {};//this list used to store each player object
//var BLOCK_LIST = {};

//this info sent to player on connection
var playerSpeed = 0.05;
var playerHeight = 1;

// var blockWidth = 100;
// var blockHeight = 100;
// var numBlocks = 0;
// var numPoints = 0;//3d

//var direction = new THREE.Vector3();//used to save player x,z

/*
This is the Player Object
It stores all information about current player
id is used to identify player in lists
*/
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

  var player = Player(socket.id);//creating player with socket id
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
      var player = PLAYER_LIST[i];
      pack.push({
        x:player.x,
        y:player.y,
        z:player.z,
        id:player.id,
        height:player.height,
        width:player.width,
        isPlayer:true,
        isBlock:false,
        isPoint:false
      });
  }

  // for (var i in BLOCK_LIST){
  //   var block = BLOCK_LIST[i];
  //   pack.push({
  //     x:block.x,
  //     y:block.y,
  //     height:block.height,
  //     width:block.width,
  //     isPlayer:false,
  //     isBlock:true,
  //     isPoint:false
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
