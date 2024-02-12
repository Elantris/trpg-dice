import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import randomInt from './randomInt'

const roll: (count: number, sides: number) => RollResult = (count, sides) => {
  if (count > 20) {
    throw new Error('INVALID_COUNT')
  }
  if (sides < 1 || sides > 100) {
    throw new Error('INVALID_SIDES')
  }

  const rolls: number[] = Array.from({ length: count }, () => randomInt(1, sides))

  return {
    value: sum(rolls),
    rolls,
  }
}

export default roll
