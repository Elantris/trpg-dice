import { RollResult } from '../utils/cache'
import explode from './explode'

const explodingSuccess: (times: number, sides: number, target: number) => RollResult = (times, sides, target) => {
  const { rolls } = explode(times, sides)

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
