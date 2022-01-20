import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import roll from './roll'

const dropHighest: (times: number, sides: number, ignore: number) => RollResult = (times, sides, ignore) => {
  const { rolls } = roll(times, sides)

  return {
    value: sum(rolls.sort((a, b) => a - b).slice(0, ignore * -1)),
    rolls,
  }
}

export default dropHighest
