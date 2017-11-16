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
var socketApp = express();
var socketServer = http.Server(socketApp);
var io = socketIo(socketServer);

// [START external_ip]
// In order to use websockets on App Engine, you need to connect directly to
// application instance using the instance's public external IP. This IP can
// be obtained from the metadata server.
var METADATA_NETWORK_INTERFACE_URL = 'http://metadata/computeMetadata/v1/' +
  'instance/network-interfaces/0/access-configs/0/external-ip';

function getExternalIp(cb) {
  var options = {
    url: METADATA_NETWORK_INTERFACE_URL,
    headers: {
      'Metadata-Flavor': 'Google'
    }
  };

  request(options, function (err, resp, body) {
    if (err || resp.statusCode !== 200) {
      console.log('Error while talking to metadata server, assuming localhost');
      return cb('localhost');
    }
    console.log('Successfully found a external-ip', body);
    return cb(body);
  });
}
// [END external_ip]

app.use(express.static(path.resolve(__dirname, 'build')));
app.get('/', function (req, res) {
  console.log('here?');
  getExternalIp(function (externalIp) {
    console.log('getting this', externalIp);
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
  });
});
const PORT = process.env.PORT ? process.env.PORT : 3000;
server.listen(PORT, function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});


// SOCKET SETUP
const GameManager = codenames.GameManager;
const gameManagers = new buckets.Dictionary();

const applyGameToSocket = (socket, partyId) => {
  socket.join(partyId);

  let gameManager = gameManagers.get(partyId);
  if (_.isUndefined(gameManager)) {
    gameManager = new GameManager();
    gameManagers.set(partyId, gameManager);
  };
  
  // Subscribe to changes in game state
  gameManager.gameChangeObservable.subscribe(gameState => {
    socket.emit('gameChanged', gameState);
  });

  // Starts a new game for the room
  socket.on('newGame', () => {
    gameManager.setNewGame();
  });

  // Stage a new tile for submit
  socket.on('stageGuess', (coord) => {
    gameManager.handleStageGuess(coord);
  });

  // Submit a tile for turn
  socket.on('submitGuess', (coord) => {
    gameManager.handleSubmitGuess(coord);
  });
}


io.on('connection', function (socket) {
  socket.on('makeParty', function (partyId) {
    if(io.sockets.adapter.rooms[partyId] === undefined) {
      console.log('User made a new party', partyId);
      applyGameToSocket(socket, partyId);
      socket.emit('inPartyStatus', true);
      let gameManager = gameManagers.get(partyId);
      socket.emit('gameChanged', gameManager.gameState);
    } else {
      console.log('User failed to make a new party', partyId);
      socket.emit('inPartyStatus', false);
    }
  });
  socket.on('joinParty', function (partyId) {
    if (
      socket.rooms[partyId] !== undefined &&
      io.sockets.adapter.rooms[partyId] !== undefined
    ) {
      console.log('User joined a party', partyId);
      applyGameToSocket(socket, partyId);
      socket.emit('inPartyStatus', true);
      let gameManager = gameManagers.get(partyId);
      socket.emit('gameChanged', gameManager.gameState);
    } else {
      console.log('User failed to join a party', partyId);
      socket.emit('inPartyStatus', false);
    }
  });
});

socketServer.listen(65080, () => {
  console.log('Socket listening on *:', 65080);
});