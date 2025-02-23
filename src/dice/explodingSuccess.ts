import { RollResult } from '../utils/cache.js'
import explode from './explode.js'

const explodingSuccess: (
  count: number,
  sides: number,
  target: number,
) => RollResult = (count, sides, target) => {
  const { rolls } = explode(count, sides)

  let value = 0
  let sum = 0
  for (const roll of rolls) {
    sum += roll
    if (roll < sides) {
      if (sum > target) {
        value += 1
      }
      sum = 0
    }
  }

  return {
    value,
    rolls,
  }
}

export default explodingSuccess
