import drop from '../dice/drop'
import dropHighest from '../dice/dropHighest'
import explode from '../dice/explode'
import explodingSuccess from '../dice/explodingSuccess'
import keep from '../dice/keep'
import keepLowest from '../dice/keepLowest'
import openTest from '../dice/openTest'
import reroll from '../dice/reroll'
import rerollOnce from '../dice/rerollOnce'
import roll from '../dice/roll'
import rollWithLower from '../dice/rollWithLower'
import rollWithUpper from '../dice/rollWithUpper'
import success from '../dice/success'
import { DICE_REGEXP, EXPRESSION_REGEXP, RollResult } from './cache'
import notEmpty from './notEmpty'

type DICE_METHOD =
  | 'roll'
  | 'drop'
  | 'keep'
  | 'reroll'
  | 'rerollOnceAndKeep'
  | 'rerollOnceAndChoose'
  | 'success'
  | 'explode'
  | 'explodingSuccess'
  | 'open'
  | 'dropHigh'
  | 'keepLow'
  | 'upperBound'
  | 'lowerBound'
  | 'addUpperBound'
  | 'addLowerBound'
  | 'subtractUpperBound'
  | 'subtractLowerBound'

const DICE_METHODS: {
  [name in DICE_METHOD]: {
    regexp: RegExp
    exec: (data: number[]) => RollResult
  }
} = {
  roll: {
    regexp: /^\d*d\d+$/gi,
    exec: data => roll(data[0], data[1]),
  },
  drop: {
    regexp: /^\d*d\d+d\d+$/gi,
    exec: data => drop(data[0], data[1], data[2]),
  },
  keep: {
    regexp: /^\d*d\d+k\d+$/gi,
    exec: data => keep(data[0], data[1], data[2]),
  },
  reroll: {
    regexp: /^\d*d\d+r\d+$/gi,
    exec: data => reroll(data[0], data[1], data[2]),
  },
  rerollOnceAndKeep: {
    regexp: /^\d*d\d+rk\d+$/gi,
    exec: data => rerollOnce(data[0], data[1], data[2]),
  },
  rerollOnceAndChoose: {
    regexp: /^\d*d\d+rc\d+$/gi,
    exec: data => rerollOnce(data[0], data[1], data[2], true),
  },
  success: {
    regexp: /^\d*d\d+s\d+$/gi,
    exec: data => success(data[0], data[1], data[2]),
  },
  explode: {
    regexp: /^\d*d\d+e$/gi,
    exec: data => explode(data[0], data[1]),
  },
  explodingSuccess: {
    regexp: /^\d*d\d+es\d+$/gi,
    exec: data => explodingSuccess(data[0], data[1], data[2]),
  },
  open: {
    regexp: /^\d*d\d+o$/gi,
    exec: data => openTest(data[0], data[1]),
  },
  dropHigh: {
    regexp: /^\d*d\d+dh\d+$/gi,
    exec: data => dropHighest(data[0], data[1], data[2]),
  },
  keepLow: {
    regexp: /^\d*d\d+kl\d+$/gi,
    exec: data => keepLowest(data[0], data[1], data[2]),
  },
  upperBound: {
    regexp: /^\d*d\d+u\d+$/gi,
    exec: data => rollWithUpper(data[0], data[1], data[2]),
  },
  lowerBound: {
    regexp: /^\d*d\d+l\d+$/gi,
    exec: data => rollWithLower(data[0], data[1], data[2]),
  },
  addUpperBound: {
    regexp: /^\d*d\d+a\d+u\d+$/gi,
    exec: data => rollWithUpper(data[0], data[1], data[3], data[2]),
  },
  addLowerBound: {
    regexp: /^\d*d\d+a\d+l\d+$/gi,
    exec: data => rollWithLower(data[0], data[1], data[3], data[2]),
  },
  subtractUpperBound: {
    regexp: /^\d*d\d+s\d+u\d+$/gi,
    exec: data => rollWithUpper(data[0], data[1], data[3], data[2] * -1),
  },
  subtractLowerBound: {
    regexp: /^\d*d\d+s\d+l\d+$/gi,
    exec: data => rollWithLower(data[0], data[1], data[3], data[2] * -1),
  },
}

const getParameters: (expression: string) => number[] = expression =>
  expression.split(/[a-z]+/gi).map(v => parseInt(v) || 1)

const rollDice: (
  expression: string,
  times: number,
) => {
  diceExpressions: {
    content: string
    method: DICE_METHOD
    params: number[]
  }[]
  rollResults: RollResult[][]
} = (expression, times) => {
  if (!expression) {
    throw new Error('INVALID_EXPRESSION')
  }
  if (expression.length > 50) {
    throw new Error('INVALID_EXPRESSION_LENGTH')
  }

  if (!Number.isSafeInteger(times) || times < 1 || times > 10) {
    throw new Error('INVALID_TIMES')
  }

  EXPRESSION_REGEXP.lastIndex = 0
  if (!EXPRESSION_REGEXP.test(expression.replace(/Math\.\w+\(/gi, '(').replace(/[\(\)]/gi, ''))) {
    throw new Error('INVALID_EXPRESSION')
  }

  DICE_REGEXP.lastIndex = 0
  const diceExpressions: {
    content: string
    method: DICE_METHOD
    params: number[]
  }[] =
    expression
      .match(DICE_REGEXP)
      ?.map(content => {
        let method: DICE_METHOD
        for (method in DICE_METHODS) {
          DICE_METHODS[method].regexp.lastIndex = 0
          if (DICE_METHODS[method].regexp.test(content)) {
            return {
              content,
              method,
              params: getParameters(content),
            }
          }
        }
        return null
      })
      .filter(notEmpty) ?? []

  if (diceExpressions.length > 10) {
    throw new Error('INVALID_DICE_EXPRESSIONS_NUMBER')
  }

  const rollResults: RollResult[][] = []
  for (let i = 0; i < times; i++) {
    const rollResult: RollResult[] = []
    for (const diceExpression of diceExpressions) {
      rollResult.push(DICE_METHODS[diceExpression.method].exec(diceExpression.params))
    }
    rollResults.push(rollResult)
  }

  return {
    diceExpressions,
    rollResults,
  }
}

export default rollDice
