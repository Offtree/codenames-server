const _ = require('lodash');
const words = require('./words');
const CodenamesConstants = require('./contants');

const buildMasterCard = () => {
  const grid = _.shuffle(
    _.flatMap(_.range(0, 5), row => {
      return _.map(_.range(0, 5), col => {
        return [row, col]
      })
    })
  );
  const firstPlayer = _.sample([CodenamesConstants.BLUE_TEAM, CodenamesConstants.RED_TEAM]);
  return {
    firstPlayer,
    placements: {
      [CodenamesConstants.RED_TEAM]: grid.splice(0, firstPlayer === CodenamesConstants.RED_TEAM ? 6 : 5),
      [CodenamesConstants.BLUE_TEAM]: grid.splice(0, firstPlayer === CodenamesConstants.RED_TEAM ? 5 : 6),
      [CodenamesConstants.BOMB]: grid.splice(0, 1),
    }
  };
}

const buildPlayerGrid = () => {
  return _.chunk(
    _.sampleSize(words, 25),
    5
  );
}

module.exports = {
  buildMasterCard,
  buildPlayerGrid
}