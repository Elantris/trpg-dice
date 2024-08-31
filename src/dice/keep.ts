import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import roll from './roll'

const keep: (count: number, sides: number, highDice: number) => RollResult = (
  count,
  sides,
  highDice,
) => {
  const { rolls } = roll(count, sides)

  return {
    value: sum(rolls.sort((a, b) => a - b).slice(highDice * -1)),
    rolls,
  }
}

export default keep
