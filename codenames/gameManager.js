const _ = require('lodash');
const rxjs = require('rxjs');
const words = require('./words');
const Observable = rxjs.Observable;
const Subject = rxjs.Subject;

const INITIAL_STAGED_GUESS = [undefined, undefined];
const BLUE_TEAM = 'B';
const RED_TEAM = 'R';
const BOMB = 'X';
const NOONE = 'N';

class GameManager {

  constructor() {
    this.gameChangeObservable = new Subject();
    this.setNewGame();
  }

  setNewGame() {
    this.buildPlayerGrid();
    this.buildMasterCard();
    this.stagedGuess = INITIAL_STAGED_GUESS;
    this.submittedGuesses = [];
    this.notifyGameChange();
  }

  get gameState() {
    return {
      playerGrid: this.playerGrid,
      masterCard: this.masterCard,
      submittedGuesses: this.submittedGuesses,
      stagedGuess: this.stagedGuess
    }
  }

  getOwnerAtCoord(coord) {
    let owner = NOONE;
    if (_.some(this.masterCard.placements[RED_TEAM], goal => _.isEqual(goal, coord))) {
      owner = RED_TEAM;
    }
    if (_.some(this.masterCard.placements[BLUE_TEAM], goal => _.isEqual(goal, coord))) {
      owner = BLUE_TEAM;
    } 
    if (_.some(this.masterCard.placements[BOMB], goal => _.isEqual(goal, coord))) {
      owner = BOMB;
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
    const firstPlayer = _.sample([BLUE_TEAM, RED_TEAM]);
    this.masterCard = {
      firstPlayer,
      placements: {
        [RED_TEAM]: grid.splice(0, firstPlayer === RED_TEAM ? 6 : 5),
        [BLUE_TEAM]: grid.splice(0, firstPlayer === RED_TEAM ? 5 : 6),
        [BOMB]: grid.splice(0, 1),
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
    this.gameChangeObservable.next(this.gameState)
  }

  handleSubmitGuess(coord) {
    this.submittedGuesses.push({
      coordinate: coord,
      owner: this.getOwnerAtCoord(coord)
    });
    this.stagedGuess = INITIAL_STAGED_GUESS;
    this.notifyGameChange();
  }
  
  handleStageGuess(coord) {
    this.stagedGuess = coord;
    this.notifyGameChange();
  }
}

module.exports = GameManager;
