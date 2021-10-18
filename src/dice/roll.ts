import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import randomInt from './randomInt'

const roll: (times: number, sides: number) => RollResult = (times, sides) => {
  if (times < 1 || sides < 1) {
    throw new Error('invalid number')
  }

  if (times > 20 || sides > 100) {
    throw new Error('too many times or sides')
  }

  const rolls: number[] = []

  for (let i = 0; i < times; i++) {
    rolls.push(randomInt(1, sides))
  }

  return {
    total: sum(rolls),
    rolls,
  }
}

export default roll
