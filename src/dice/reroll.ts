import { sum } from 'ramda'
import { RollResult } from '../utils/cache.js'
import randInt from '../utils/randInt.js'

const reroll: (count: number, sides: number, minimum: number) => RollResult = (
  count,
  sides,
  minimum,
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
  while (results.length < count) {
    const roll = randInt(1, sides)
    rolls.push(roll)
    if (roll < minimum) {
      continue
    }
    results.push(roll)
  }

  return {
    value: sum(results),
    rolls,
  }
}

export default reroll
