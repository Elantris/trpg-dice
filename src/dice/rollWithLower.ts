import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import roll from './roll'

const rollWithLower: (times: number, sides: number, minimum: number, modifier?: number) => RollResult = (
  times,
  sides,
  minimum,
  modifier = 0,
) => {
  const { rolls } = roll(times, sides)

  return {
    value: sum(rolls.map(roll => (roll + modifier < minimum ? minimum : roll + modifier))),
    rolls,
  }
}

export default rollWithLower
