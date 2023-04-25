import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import randomInt from './randomInt'

const roll: (times: number, sides: number) => RollResult = (times, sides) => {
  if (times > 20) {
    throw new Error('INVALID_TIMES')
  }
  if (sides < 1 || sides > 100) {
    throw new Error('INVALID_SIDES')
  }

  const rolls: number[] = []

  for (let i = 0; i < times; i++) {
    rolls.push(randomInt(1, sides))
  }

  return {
    value: sum(rolls),
    rolls,
  }
}

export default roll
