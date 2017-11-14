var app = require('express')();
var server = require('http').Server(app);
const path = require('path');
var io = require('socket.io')(server);
const _ = require('lodash');
const codenames = require('./codenames');
const buckets = require('buckets-js');

const gameManager = codenames.gameManager;
const gameManagers = new buckets.Dictionary();

const applyGameToSocket = (socket, partyId) => {
  socket.join(partyId);
  const inPartyRoom = socket.in(partyId);
  const toPartyRoom = socket.to(partyId);

  let gameManager = gameManagers.get(partyId);
  if (_.isUndefined(gameManager)) {
    gameManager = new gameManager();
    gameManagers.set(partyId, gameManager);
  };
  
  // Subscribe to changes in game state
  gameManager.gameChangeObservable.subscribe(gameState => {
    toPartyRoom.emit('gameChanged', gameState);
  });

  // Starts a new game for the room
  socket.on('newGame', () => {
    gameManager.newGame();
  })

  // Stage a new tile for submit
  socket.on('stageGuess', (coord) => {
    gameManager.handleStageGuess(coord);
  })

  // Submit a tile for turn
  socket.on('submitGuess', (coord) => {
    gameManager.handleSubmitGuess(coord);
  })
}


io.on('connection', function (socket) {
  socket.on('makeParty', function (partyId) {
    if(io.sockets.adapter.rooms[partyId] === undefined) {
      applyGameToSocket(socket, partyId);
      socket.emit('inPartyStatus', true);
    } else {
      socket.emit('inPartyStatus', false);
    }
  });
  socket.on('joinParty', function (partyId) {
    if (
      socket.rooms[partyId] !== undefined &&
      io.sockets.adapter.rooms[partyId] !== undefined
    ) {
      applyGameToSocket(socket, partyId);
      socket.emit('inPartyStatus', true);
    } else {
      socket.emit('inPartyStatus', false);
    }
  });
});

app.get('/', function (req, res) {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

server.listen(3000, function () {
  console.log('listening on *:3000');
});
