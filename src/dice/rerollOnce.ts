import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import randomInt from './randomInt'

const rerollOnce: (times: number, sides: number, minimum: number, chooseHigher?: boolean) => RollResult = (
  times,
  sides,
  minimum,
  chooseHigher = false,
) => {
  if (times < 1 || sides < 1 || minimum < 1) {
    throw new Error('invalid number')
  }

  if (minimum > sides) {
    throw new Error('invalid minimum')
  }

  const rolls: number[] = []
  const results: number[] = []

  for (let i = 0; i < times; i++) {
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
    total: sum(results),
    rolls,
  }
}

export default rerollOnce
