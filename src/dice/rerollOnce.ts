import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import randomInt from './randomInt'

const rerollOnce: (count: number, sides: number, minimum: number, chooseHigher?: boolean) => RollResult = (
  count,
  sides,
  minimum,
  chooseHigher = false,
) => {
  if (count > 20) {
    throw new Error('INVALID_COUNT')
  }
  if (sides < 1 || sides > 100) {
    throw new Error('INVALID_SIDES')
  }
  if (minimum > sides) {
    throw new Error('INVALID_DICE_EXPRESSION')
  }

  const rolls: number[] = []
  const results: number[] = []

  for (let i = 0; i < count; i++) {
    const roll = randomInt(1, sides)
    rolls.push(roll)
    if (roll < minimum) {
      const roll2 = randomInt(1, sides)
      rolls.push(roll2)
      results.push(chooseHigher ? Math.max(roll, roll2) : roll2)
    } else {
      results.push(roll)
    }
  }

  return {
    value: sum(results),
    rolls,
  }
}

export default rerollOnce
