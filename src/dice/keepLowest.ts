import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import roll from './roll'

const keepLowest: (times: number, sides: number, keep: number) => RollResult = (times, sides, keep) => {
  const { rolls } = roll(times, sides)

  return {
    value: sum(rolls.sort((a, b) => a - b).slice(0, keep)),
    rolls,
  }
}

export default keepLowest
