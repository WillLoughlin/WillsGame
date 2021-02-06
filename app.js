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

//git add .
//git commit -m "commit notes"
//git push heroku master

//var THREE = require('./client/js/three.js');



var SOCKET_LIST = {};
var PLAYER_LIST = {};
//var BLOCK_LIST = {};
//var POINT_LIST = {};//3d

var playerSpeed = 0.05;
var playerHeight = 1;

//var playerHeight = 100;
var playerWidth = 50;

// var blockWidth = 100;
// var blockHeight = 100;
// var numBlocks = 0;
// var numPoints = 0;//3d

//var direction = new THREE.Vector3();//used to save player x,z

var Player = function(id){
  var self = {
    x:0,
    y:0,
    z:0,
    thetaX:0,
    thetaY:0,
    thetaZ:0,
    id:id,
    width:playerWidth,
    height:playerHeight,
    name:"Will",
    number:""+Math.floor(10*Math.random()),
    cameraX:0,
    cameraY:0,
    pressingRight:false,
    pressingLeft:false,
    pressingUp:false,
    pressingDown:false,
    arrowUp:false,
    arrowDown:false,
    arrowRight:false,
    arrowLeft:false,
    maxSpd:0.3,
    viewSpd:0.05,
    verticalSpeed:0,
    maxVerticalSpeed:10
  }
  self.updatePosition = function(){
    if (self.pressingRight){
      self.x = self.x + self.maxSpd * Math.sin(self.thetaY + 1.5708); //adding 90 degrees in radians
      self.z = self.z + self.maxSpd * Math.cos(self.thetaY + 1.5708);
    }
    if (self.pressingLeft){
      self.x = self.x - self.maxSpd * Math.sin(self.thetaY + 1.5708);
      self.z = self.z - self.maxSpd * Math.cos(self.thetaY + 1.5708);
    }
    if(self.verticalUp) {
      self.y = self.y + self.maxSpd;
    }
    if(self.verticalDown) {
      self.y = self.y - self.maxSpd;
    }
    if(self.pressingUp) {
      self.z = self.z + self.maxSpd * Math.cos(self.thetaY);
      self.x = self.x + self.maxSpd * Math.sin(self.thetaY);
      //console.log(self.z);
    }
    if(self.pressingDown) {
      self.z = self.z - self.maxSpd * Math.cos(self.thetaY);
      self.x = self.x - self.maxSpd * Math.sin(self.thetaY);
      //console.log(self.z);
    }
    // if(self.arrowUp) {
    //   self.thetaX = self.thetaX - self.viewSpd;
    // }
    // if(self.arrowDown) {
    //   self.thetaX = self.thetaX + self.viewSpd;
    // }
    // if(self.arrowLeft) {
    //   self.thetaY = self.thetaY - self.viewSpd;
    // }
    // if(self.arrowRight) {
    //   self.thetaY = self.thetaY + self.viewSpd;
    // }
  }

  // self.checkCollisionPlayerAllBlocks = function(){
  //   for (var i in BLOCK_LIST){
  //     var block = BLOCK_LIST[i];
  //     if (self.checkCollisionPlayerBlock(block)){
  //       return true;
  //     }
  //   }
  //   return false;
  // }//calls check single block fncn with all blocks
  // self.checkCollisionPlayerBlock = function(block){
  //   var selfXTL = self.x - (self.width/2);
  //   var selfYTL = self.y - (self.height/2);
  //   var bXTL = block.x - (block.width/2);
  //   var bYTL = block.y - (block.height/2);
  //
  //   if (selfXTL < bXTL + block.width &&
  //     selfXTL + self.width > bXTL &&
  //     selfYTL < bYTL + block.height &&
  //     selfYTL + self.height > bYTL) {
  //       return true;
  //   }
  //   return false;
  // }//checks player against single block
  self.jump = function(){
    self.verticalSpeed = -25;
  }//function to make player jump

  return self;
}


//Socket.io on connection and disconnection
var io = require('socket.io')(serv,{});
//main io connection and key detection function
io.sockets.on('connection', function(socket){//called when player connects with server
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;//adding player socket to list
  //console.log('socket connection');

  var player = Player(socket.id);
  console.log("New Player with ID: " + socket.id);
  PLAYER_LIST[socket.id] = player;


  SOCKET_LIST[socket.id].emit('setID', {id:socket.id, spd:playerSpeed, hgt:playerHeight});//emmitting id of player, used for centering camera

  //this sends all other player information to new player just connected
  var playerPack = [];
  for (var i in PLAYER_LIST){
      var player = PLAYER_LIST[i];
      playerPack.push({
        name:player.name,
        x:player.x,
        y:player.y,
        z:player.z,
        id:player.id
      });
  }
  SOCKET_LIST[socket.id].emit('initPlayers', playerPack);//sending other player information to new player

  //now we send new player information to all other new players
  for(var i in SOCKET_LIST) {
    if(i != socket.id){//this makes sure it doesnt send single new player info to the newly connected player (they get all info from initPlayers)
      //console.log("sent new player with id: " + player.id + "information to player " + i);
      SOCKET_LIST[i].emit('newPlayer',{id:socket.id,x:player.x,y:player.y,z:player.z,name:player.name});//player is new player, sending information to all others
    }
  }

  socket.on('disconnect',function(){//called when player disconnects from server
    console.log("Player Disconnected with ID: " + socket.id);
    for(var i in SOCKET_LIST) {
      if(i != socket.id){//this sends player disconnection info to all players
        SOCKET_LIST[i].emit('disconnectedPlayer',{id:socket.id});//sending disconnect information to all others
      }
    }
    delete SOCKET_LIST[socket.id];//deleting player's socket from list
    delete PLAYER_LIST[socket.id];
  });



  //This function recieves player position and direction information from each player every cycle of gameloop
  socket.on('selfMoveInfo',function(data){
    player.cameraX = data[0].cameraX;
    player.cameraY = data[0].cameraY;
    player.x = data[0].playerX;
    player.y = data[0].playerY;
    player.z = data[0].playerZ;
  });

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
    } else if (data.inputId === 'arrowUp') {
      player.arrowUp = data.state;
    } else if (data.inputId === 'arrowDown') {
      player.arrowDown = data.state;
    } else if (data.inputId === 'arrowLeft') {
      player.arrowLeft = data.state;
    } else if (data.inputId === 'arrowRight') {
      player.arrowRight = data.state;
    }
  });
});


setInterval(function(){//game loop
  var pack = [];//pack to transfer data
  for (var i in PLAYER_LIST){
      var player = PLAYER_LIST[i];
      player.updatePosition();
      //console.log("Player " + i + " position: " + player.x + "," + player.z);
      pack.push({
        x:player.x,
        y:player.y,
        z:player.z,
        maxSpd:player.maxSpd,
        thetaX:player.thetaX,//camera angle in radians
        thetaY:player.thetaY,
        thetaZ:player.thetaZ,
        id:player.id,
        height:player.height,
        width:player.width,
        number:player.number,
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
