var _ = require('lodash');
var buckets = require('buckets-js');
var express = require('express');
var request = require('request');
var path = require('path');
var socketIo = require('socket.io');

const codenames = require('./codenames');

var http = require('http');
var app = express();
var server = http.Server(app);
var io = socketIo(server);

app.get('/', function (req, res) {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});
app.use(express.static(path.resolve(__dirname, 'build')));

const PORT = process.env.PORT ? process.env.PORT : 3000;
server.listen(PORT, () => {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});

// SOCKET SETUP
const GameManager = codenames.GameManager;
const gameManagers = new buckets.Dictionary();

const applyGameToSocket = (socket, partyId, username) => {
  socket.join(partyId);

  let gameManager = gameManagers.get(partyId);
  if (_.isUndefined(gameManager)) {
    gameManager = new GameManager();
    gameManagers.set(partyId, gameManager);
  };
  
  // Add user to the game
  gameManager.joinGame({
    username,
    socket
  });

  // Starts a new game for the room
  socket.on('newGame', () => {
    gameManager.setNewGame();
  });

  // Stage a new tile for submit
  socket.on('stageGuess', (coord) => {
    gameManager.handleStageGuess(coord);
  });

  // Stage a new tile for submit
  socket.on('submitGuess', (coord) => {
    gameManager.handleSubmitGuess(coord);
  });

  // Leave game
  socket.on('disconnect', () => {
    gameManager.handlePlayerLeave(socket.id);
  })

  // Submit a tile for turn
  socket.on('playersChanged', (playerStatus) => {
    const player = gameManager.getPlayerFromSocket(socket.id)
    gameManager.updatePlayerStatus(player.id, playerStatus)
  });
}


io.on('connection', function (socket) {
  socket.on('makeParty', ([partyId, username]) => {
    if(io.sockets.adapter.rooms[partyId] === undefined) {
      console.log('User made a new party', partyId);
      applyGameToSocket(socket, partyId, username);
      let gameManager = gameManagers.get(partyId);
      socket.emit('inPartyStatus', gameManager.getPlayerFromSocket(socket.id).id);
      gameManager.setNewGame();
    } else {
      console.log('User failed to make a new party', partyId);
      socket.emit('inPartyStatus', null);
    }
  });
  socket.on('joinParty', ([partyId, username]) => {
    if (
      socket.rooms[partyId] === undefined &&
      io.sockets.adapter.rooms[partyId] !== undefined
    ) {
      console.log('User joined a party', partyId);
      applyGameToSocket(socket, partyId, username);
      let gameManager = gameManagers.get(partyId);
      const player = gameManager.getPlayerFromSocket(socket.id);
      socket.emit('inPartyStatus', player.id);
      socket.emit('gameChanged', gameManager.getGameState(player.isMaster));
    } else {
      console.log('User failed to join a party', partyId);
      socket.emit('inPartyStatus', null);
    }
  });
});
