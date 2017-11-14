const _ = require('lodash');
const rxjs = require('rxjs');
const words = require('./words');
const Observable = rxjs.Observable;
const Subject = rxjs.Subject;

const INITIAL_STAGED_GUESS = [undefined, undefined];

class GameManager {
  constructor() {
    this.gameChangeObservable = new Subject();
    this.setNewGame();
  }

  setNewGame() {
    this.playerGrid = this.buildPlayerGrid();
    this.masterCard = this.buildMasterCard();
    this.stagedGuess = INITIAL_STAGED_GUESS;
    this.selectedGuesses = [];
    this.notifyGameChange();
  }

  get gameState() {
    return {
      playerGrid: this.playerGrid,
      masterCard: this.masterCard,
      selectedGuesses: this.selectedGuesses,
      stagedGuess: this.stagedGuess
    }
  }

  buildMasterCard() {
    this.masterCard = 1;
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
    this.selectedGuesses.push({
      coordinates: coord,
      owner: undefined
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
