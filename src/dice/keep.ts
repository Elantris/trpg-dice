import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import roll from './roll'

const keep: (times: number, sides: number, highDice: number) => RollResult = (times, sides, highDice) => {
  if (highDice < 1) {
    throw new Error('invalid number')
  }

  const { rolls } = roll(times, sides)

  return {
    total: sum(rolls.sort((a, b) => a - b).slice(highDice * -1)),
    rolls,
  }
}

export default keep
