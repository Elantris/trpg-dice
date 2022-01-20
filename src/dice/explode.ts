import { sum } from 'ramda'
import { RollResult } from '../utils/cache'
import randomInt from './randomInt'

const explode: (times: number, sides: number) => RollResult = (times, sides) => {
  if (times > 20) {
    throw new Error('times should be 1 ~ 20')
  }
  if (sides < 1 || sides > 100) {
    throw new Error('sides should be 1 ~ 100')
  }

  const rolls: number[] = []
  let count = 0
  while (count < times) {
    const roll = randomInt(1, sides)
    if (roll < sides) {
      count += 1
    }
    rolls.push(roll)
  }

  return {
    value: sum(rolls),
    rolls,
  }
}

export default explode
