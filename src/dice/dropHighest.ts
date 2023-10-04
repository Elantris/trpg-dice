import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import roll from './roll'

const dropHighest: (count: number, sides: number, ignore: number) => RollResult = (count, sides, ignore) => {
  const { rolls } = roll(count, sides)

  return {
    value: sum(rolls.sort((a, b) => a - b).slice(0, ignore * -1)),
    rolls,
  }
}

export default dropHighest
