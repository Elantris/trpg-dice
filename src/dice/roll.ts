import { sum } from 'ramda'
import { RollResult } from '../utils/cache.js'
import randInt from '../utils/randInt.js'

const roll: (count: number, sides: number) => RollResult = (count, sides) => {
  if (count > 20) {
    throw new Error('INVALID_COUNT')
  }
  if (sides < 1 || sides > 100) {
    throw new Error('INVALID_SIDES')
  }

  const rolls: number[] = Array.from({ length: count }, () => randInt(1, sides))

  return {
    value: sum(rolls),
    rolls,
  }
}

export default roll
