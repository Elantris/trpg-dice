import { sum } from 'ramda'
import { type RollResult } from '../utils/cache'
import randInt from '../utils/randInt'

const explode: (count: number, sides: number) => RollResult = (
  count,
  sides,
) => {
  if (count > 20) {
    throw new Error('INVALID_COUNT')
  }
  if (sides < 1 || sides > 100) {
    throw new Error('INVALID_SIDES')
  }

  const rolls: number[] = []
  let tmp = 0
  while (tmp < count) {
    const roll = randInt(1, sides)
    if (roll < sides) {
      tmp += 1
    }
    rolls.push(roll)
  }

  return {
    value: sum(rolls),
    rolls,
  }
}

export default explode
