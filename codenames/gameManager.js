const _ = require('lodash');
const words = require('./words');
const CodenamesConstants = require('./contants');

class GameManager {
  constructor() {
    this.inProgress = true;
    this.allPlayers = [];
    this.setNewGame();
  }

  joinGame(newPlayer) {
    this.allPlayers.push(
      Object.assign({
        ready: this.inProgress,
        isMaster: true
      }, newPlayer)
    );
  }

  leaveGame(players) {
    // Socket leaves game
  }

  setNewGame() {
    this.inProgress = true;
    this.buildPlayerGrid();
    this.buildMasterCard();
    this.stagedGuess = CodenamesConstants.INITIAL_STAGED_GUESS;
    this.submittedGuesses = [];
    this.notifyGameChange();
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

  buildMasterCard() {
    const grid = _.shuffle(
      _.flatMap(_.range(0, 5), row => {
        return _.map(_.range(0, 5), col => {
          return [row, col]
        })
      })
    );
    const firstPlayer = _.sample([CodenamesConstants.BLUE_TEAM, CodenamesConstants.RED_TEAM]);
    this.masterCard = {
      firstPlayer,
      placements: {
        [CodenamesConstants.RED_TEAM]: grid.splice(0, firstPlayer === CodenamesConstants.RED_TEAM ? 6 : 5),
        [CodenamesConstants.BLUE_TEAM]: grid.splice(0, firstPlayer === CodenamesConstants.RED_TEAM ? 5 : 6),
        [CodenamesConstants.BOMB]: grid.splice(0, 1),
      }
    };
  }

  buildPlayerGrid() {
    this.playerGrid = _.chunk(
      _.sampleSize(words, 25),
      5
    );
  }

  notifyGameChange() {
    this.allPlayers.forEach(player => {
      player.socket.emit('gameChanged', this.getGameState(player.isMaster));
    });
  }

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
}

module.exports = GameManager;
