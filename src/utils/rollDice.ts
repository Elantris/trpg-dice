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

const ParameterSymbols = ['X', 'Y', 'Z', 'W']
const getParameters: (expression: string) => number[] = (expression) =>
  expression.split(/[a-z]+/gi).map((v) => (v ? parseInt(v) : 1))

type DiceExpression = {
  content: string
  format: string
  name: string
  params: number[]
}

const DICE_METHODS: {
  [format: string]: {
    name: string
    exec: (data: number[]) => RollResult
  }
} = {
  XdY: {
    name: 'roll',
    exec: (data) => roll(data[0], data[1]),
  },
  XdYdZ: {
    name: 'drop',
    exec: (data) => drop(data[0], data[1], data[2]),
  },
  XdYkZ: {
    name: 'keep',
    exec: (data) => keep(data[0], data[1], data[2]),
  },
  XdYrZ: {
    name: 'reroll',
    exec: (data) => reroll(data[0], data[1], data[2]),
  },
  XdYrkZ: {
    name: 'rerollOnceAndKeep',
    exec: (data) => rerollOnce(data[0], data[1], data[2]),
  },
  XdYrcZ: {
    name: 'rerollOnceAndChoose',
    exec: (data) => rerollOnce(data[0], data[1], data[2], true),
  },
  XdYsZ: {
    name: 'success',
    exec: (data) => success(data[0], data[1], data[2]),
  },
  XdYe: {
    name: 'explode',
    exec: (data) => explode(data[0], data[1]),
  },
  XdYesZ: {
    name: 'explodingSuccess',
    exec: (data) => explodingSuccess(data[0], data[1], data[2]),
  },
  XdYo: {
    name: 'open',
    exec: (data) => openTest(data[0], data[1]),
  },
  XdYdhZ: {
    name: 'dropHigh',
    exec: (data) => dropHighest(data[0], data[1], data[2]),
  },
  XdYklZ: {
    name: 'keepLow',
    exec: (data) => keepLowest(data[0], data[1], data[2]),
  },
  XdYuZ: {
    name: 'upperBound',
    exec: (data) => rollWithUpper(data[0], data[1], data[2]),
  },
  XdYlZ: {
    name: 'lowerBound',
    exec: (data) => rollWithLower(data[0], data[1], data[2]),
  },
  XdYaZuW: {
    name: 'addUpperBound',
    exec: (data) => rollWithUpper(data[0], data[1], data[3], data[2]),
  },
  XdYaZlW: {
    name: 'addLowerBound',
    exec: (data) => rollWithLower(data[0], data[1], data[3], data[2]),
  },
  XdYsZuW: {
    name: 'subtractUpperBound',
    exec: (data) => rollWithUpper(data[0], data[1], data[3], data[2] * -1),
  },
  XdYsZlW: {
    name: 'subtractLowerBound',
    exec: (data) => rollWithLower(data[0], data[1], data[3], data[2] * -1),
  },
}

const rollDice: (
  expression: string,
  times: number,
) => {
  diceExpressions: DiceExpression[]
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
  if (
    !EXPRESSION_REGEXP.test(
      expression.replace(/Math\.\w+\(/g, '(').replace(/[\(\)]+/gi, ''),
    )
  ) {
    throw new Error('INVALID_EXPRESSION')
  }

  DICE_REGEXP.lastIndex = 0
  const diceExpressions: DiceExpression[] =
    expression
      .match(DICE_REGEXP)
      ?.map((content) => {
        let index = 0
        const format = `0${content}`
          .toLocaleLowerCase()
          .replace(/\d+/gi, () => ParameterSymbols[index++] ?? '')
        if (DICE_METHODS[format]) {
          return {
            content,
            format,
            name: DICE_METHODS[format].name,
            params: getParameters(content),
          }
        }
        return null
      })
      .filter(notEmpty) ?? []

  if (diceExpressions.length > 10) {
    throw new Error('INVALID_DICE_EXPRESSIONS_NUMBER')
  }

  const rollResults: RollResult[][] = Array.from({ length: times }, () =>
    diceExpressions.map((v) => DICE_METHODS[v.format].exec(v.params)),
  )

  return {
    diceExpressions,
    rollResults,
  }
}

export default rollDice
