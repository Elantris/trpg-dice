import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import roll from './roll'

const keepLowest: (count: number, sides: number, keep: number) => RollResult = (count, sides, keep) => {
  const { rolls } = roll(count, sides)

  return {
    value: sum(rolls.sort((a, b) => a - b).slice(0, keep)),
    rolls,
  }
}

export default keepLowest
