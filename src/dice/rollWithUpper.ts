import { sum } from 'ramda'
import { RollResult } from '../utils/cache.js'
import roll from './roll.js'

const rollWithUpper: (
  count: number,
  sides: number,
  maximum: number,
  modifier?: number,
) => RollResult = (count, sides, maximum, modifier = 0) => {
  const { rolls } = roll(count, sides)

  return {
    value: sum(
      rolls.map((roll) =>
        roll + modifier > maximum ? maximum : roll + modifier,
      ),
    ),
    rolls,
  }
}

export default rollWithUpper
