import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import roll from './roll'

const rollWithUpper: (times: number, sides: number, maximum: number, modifier?: number) => RollResult = (
  times,
  sides,
  maximum,
  modifier = 0,
) => {
  const { rolls } = roll(times, sides)

  return {
    value: sum(rolls.map(roll => (roll + modifier > maximum ? maximum : roll + modifier))),
    rolls,
  }
}

export default rollWithUpper
