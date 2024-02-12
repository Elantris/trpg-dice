import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import roll from './roll'

const rollWithLower: (count: number, sides: number, minimum: number, modifier?: number) => RollResult = (
  count,
  sides,
  minimum,
  modifier = 0,
) => {
  const { rolls } = roll(count, sides)

  return {
    value: sum(rolls.map((roll) => (roll + modifier < minimum ? minimum : roll + modifier))),
    rolls,
  }
}

export default rollWithLower
