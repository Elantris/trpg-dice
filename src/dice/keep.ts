import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import roll from './roll'

const keep: (times: number, sides: number, highDice: number) => RollResult = (times, sides, highDice) => {
  const { rolls } = roll(times, sides)

  return {
    value: sum(rolls.sort((a, b) => a - b).slice(highDice * -1)),
    rolls,
  }
}

export default keep
