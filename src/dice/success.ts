import { RollResult } from '../utils/cache.js'
import roll from './roll.js'

const success: (count: number, sides: number, target: number) => RollResult = (
  count,
  sides,
  target,
) => {
  if (target >= sides) {
    throw new Error('INVALID_DICE_EXPRESSION')
  }

  const { rolls } = roll(count, sides)

  return {
    value: rolls.filter((roll) => roll > target).length,
    rolls,
  }
}

export default success
