import { Message } from 'discord.js'
import OpenColor from 'open-color'
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
import { channels, database, RollResult } from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'
import notEmpty from '../utils/notEmpty'

type DICE_METHODS =
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

const DICE_OPERATIONS: {
  [name in DICE_METHODS]?: {
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
const DICE_REGEXP = /\d*d\d+([a-z]+\d*){0,2}/gi // XdY, XdYaZbW
const EXPRESSION_REGEXP = new RegExp(`^([+\\-*/,]?(\\d+(\\.\\d+)?|${DICE_REGEXP.source}))*$`, 'gi')

const getParameters: (expression: string) => number[] = expression =>
  expression.split(/[a-z]+/gi).map(v => parseInt(v) || 1)

const rollDice: (message: Message) => Promise<void> = async message => {
  const times = /^(roll|r)(\(\d+\)):.+$/gi.test(message.content)
    ? parseInt(message.content.match(/\(\d+/g)?.[0].slice(1) || '1')
    : 1
  if (!Number.isSafeInteger(times) || times < 1 || times > 20) {
    message.channel.send(':x: ??????????????? 1 ~ 20 ???')
    return
  }

  const expression = message.content
    .slice(message.content.indexOf(':') + 1)
    .replace(/\s+/g, '')
    .trim()
  if (!expression) {
    return
  }
  if (expression.length > 50) {
    message.channel.send(':x: ??????????????? 50 ??????')
    return
  }
  EXPRESSION_REGEXP.lastIndex = 0
  if (!EXPRESSION_REGEXP.test(expression.replace(/Math\.\w+\(/gi, '(').replace(/[\(\)]/gi, ''))) {
    message.channel.send(':x: ??????????????????')
    return
  }

  DICE_REGEXP.lastIndex = 0
  const diceExpressions: {
    content: string
    method: DICE_METHODS
  }[] =
    expression
      .match(DICE_REGEXP)
      ?.map(content => {
        let method: DICE_METHODS
        for (method in DICE_OPERATIONS) {
          const regexp = DICE_OPERATIONS[method]?.regexp
          if (!regexp) {
            continue
          }
          regexp.lastIndex = 0
          if (regexp.test(content)) {
            return {
              content,
              method,
            }
          }
        }
        return null
      })
      .filter(notEmpty) || []
  if (diceExpressions.length > 10) {
    message.channel.send(':x: ?????????????????????????????? 5 ???')
    return
  }

  const commandResults: RollResult[][] = []
  const responseContents: string[] = [`Roll(**${times}**): \`${expression}\``]
  let commandError: Error | undefined = undefined

  try {
    for (let i = 0; i < times; i++) {
      let resultExpression = expression
      const rollResults: RollResult[] = []

      for (const diceExpression of diceExpressions) {
        const result = DICE_OPERATIONS[diceExpression.method]?.exec(getParameters(diceExpression.content))
        if (result) {
          resultExpression = resultExpression.replace(diceExpression.content, `${result.value}`)
          rollResults.push(result)
        }
      }

      commandResults.push(rollResults)
      responseContents.push(
        ':game_die: `RESULT_EXPRESSION` = **VALUE**'
          .replace('RESULT_EXPRESSION', resultExpression)
          .replace('VALUE', `${eval(resultExpression)}`),
      )
    }
  } catch (error: any) {
    commandError = error
  }

  const responseMessage = await message.channel.send(commandError ? ':x: ??????????????????' : responseContents.join('\n'))
  const logMessage = await channels['logger']?.send({
    embeds: [
      {
        color: colorFormatter(commandError ? OpenColor.red[5] : OpenColor.violet[5]),
        author: {
          iconURL: message.author.displayAvatarURL(),
          name: message.author.tag,
        },
        description: 'Message: [Link](MESSAGE_LINK)\nExpression: `EXPRESSION`\nTimes: TIMES'
          .replace('MESSAGE_LINK', responseMessage.url)
          .replace('EXPRESSION', expression)
          .replace('TIMES', `${times}`),
        fields: commandError
          ? [
              {
                name: 'Error',
                value: '```ERROR```'.replace('ERROR', `${commandError}`),
              },
            ]
          : commandResults
              .filter(rollResults => rollResults.length)
              .map((rollResults, index) => ({
                name: `${index + 1}`,
                value: rollResults
                  .map((result, index) =>
                    '`DICE_EXPRESSION` = (METHOD) `DICE_ROLLS` = **VALUE**'
                      .replace('DICE_EXPRESSION', diceExpressions[index].content)
                      .replace('METHOD', diceExpressions[index].method)
                      .replace('DICE_ROLLS', JSON.stringify(result.rolls))
                      .replace('VALUE', `${result.value}`),
                  )
                  .join('\n'),
              })),
        timestamp: message.createdAt,
        footer: {
          text: `${responseMessage.createdTimestamp - message.createdTimestamp}ms`,
        },
      },
    ],
  })

  logMessage && database.ref(`/logs/${responseMessage.id}`).set(logMessage.id)
}

export default rollDice
