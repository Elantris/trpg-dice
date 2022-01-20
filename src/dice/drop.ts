import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import roll from './roll'

const drop: (times: number, sides: number, ignore: number) => RollResult = (times, sides, ignore) => {
  const { rolls } = roll(times, sides)

  return {
    value: sum(rolls.sort((a, b) => a - b).slice(ignore)),
    rolls,
  }
}

export default drop
