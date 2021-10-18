import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import randomInt from './randomInt'

const reroll: (times: number, sides: number, minimum: number) => RollResult = (times, sides, minimum) => {
  if (times < 1 || sides < 1 || minimum < 1) {
    throw new Error('invalid number')
  }

  if (minimum > sides) {
    throw new Error('invalid minimum')
  }

  const rolls: number[] = []
  const results: number[] = []
  while (results.length < times) {
    const roll = randomInt(0, sides)
    rolls.push(roll)
    if (roll < minimum) {
      continue
    }
    results.push(roll)
  }

  return {
    total: sum(results),
    rolls,
  }
}

export default reroll
