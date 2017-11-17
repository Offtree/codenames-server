const _ = require('lodash');
const CodenamesConstants = require('./contants');
const Utils = require('./utils');

class GameManager {
  constructor() {
    this.playerIdTracker = 0;
    this.inProgress = false;
    this.allPlayers = [];
    this.setNewGame();
  }

  joinGame(newPlayer) {
    this.allPlayers.push(
      Object.assign({
        id: this.playerIdTracker.toString(),
        isReady: this.inProgress,
        isMaster: false
      }, newPlayer)
    );
    this.playerIdTracker ++;
    this.notifyPlayersChange();
  }

  setNewGame() {
    this.inProgress = false;
    this.playerGrid = Utils.buildPlayerGrid();
    this.masterCard = Utils.buildMasterCard();
    this.stagedGuess = CodenamesConstants.INITIAL_STAGED_GUESS;
    this.submittedGuesses = [];
    this.allPlayers.map(player => {
      return Object.assign(player, {
        isReady: false
      })
    });
    this.notifyGameChange();
    this.notifyPlayersChange();
  }

  checkAllReady() {
    if(_.every(this.allPlayers, { isReady: true })) {
      this.inProgress = true;
      this.notifyGameChange();
    }
  }

  getGameState(isMaster) {
    return {
      inProgress: this.inProgress,
      isMaster: isMaster,
      playerGrid: this.playerGrid,
      masterCard: isMaster ? this.masterCard : undefined,
      submittedGuesses: this.submittedGuesses,
      stagedGuess: this.stagedGuess
    }
  }

  getOwnerAtCoord(coord) {
    let owner = CodenamesConstants.NOONE;
    if (_.some(this.masterCard.placements[CodenamesConstants.RED_TEAM], goal => _.isEqual(goal, coord))) {
      owner = CodenamesConstants.RED_TEAM;
    }
    if (_.some(this.masterCard.placements[CodenamesConstants.BLUE_TEAM], goal => _.isEqual(goal, coord))) {
      owner = CodenamesConstants.BLUE_TEAM;
    } 
    if (_.some(this.masterCard.placements[CodenamesConstants.BOMB], goal => _.isEqual(goal, coord))) {
      owner = CodenamesConstants.BOMB;
    } 
    return owner;
  }

  getPlayerFromSocket(socketId) {
    return _.find(this.allPlayers, (player) => {
      return socketId === player.socket.id
    })
  }

  // SOCKET INS
  handleSubmitGuess(coord) {
    this.submittedGuesses.push({
      coordinate: coord,
      owner: this.getOwnerAtCoord(coord)
    });
    this.stagedGuess = CodenamesConstants.INITIAL_STAGED_GUESS;
    this.notifyGameChange();
  }
  
  handleStageGuess(coord) {
    this.stagedGuess = coord;
    this.notifyGameChange();
  }

  handlePlayerLeave(socketId) {
    this.allPlayers = _.filter(this.allPlayers,
      (player) => player.socket.id !== socketId
    );
    this.notifyPlayersChange();
  }

  updatePlayerStatus(playerId, playerStatus) {
    this.allPlayers = this.allPlayers.map(player => {
      return {
        isReady: player.id === playerId ? playerStatus.isReady : player.isReady,
        isMaster: player.id === playerId ? playerStatus.isMaster : player.isMaster,
        username: player.username,
        socket: player.socket,
        id: player.id
      }
    });
    this.notifyPlayersChange();
    this.checkAllReady();
  }

  // SOCKET OUTS
  notifyGameChange() {
    this.allPlayers.forEach(player => {
      player.socket.emit('gameChanged', this.getGameState(player.isMaster));
    });
  }

  notifyPlayersChange() {
    this.allPlayers.forEach(player => {
      player.socket.emit('playersChanged', _.map(this.allPlayers, (player) => ({
        isReady: player.isReady,
        isMaster: player.isMaster,
        username: player.username,
        id: player.id
      })));
    });
  }
}

module.exports = GameManager;
