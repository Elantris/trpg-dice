import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import randomInt from './randomInt'

const reroll: (times: number, sides: number, minimum: number) => RollResult = (times, sides, minimum) => {
  if (minimum > sides) {
    throw new Error('invalid minimum')
  }

  const rolls: number[] = []
  const results: number[] = []
  while (results.length < times) {
    const roll = randomInt(1, sides)
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
