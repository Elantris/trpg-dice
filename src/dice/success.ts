import { RollResult } from '../utils/cache'
import roll from './roll'

const success: (times: number, sides: number, target: number) => RollResult = (times, sides, target) => {
  if (target >= sides) {
    throw new Error('invalid target')
  }

  const { rolls } = roll(times, sides)

  return {
    value: rolls.filter(roll => roll > target).length,
    rolls,
  }
}

export default success
