import { Message } from 'discord.js'
import drop from '../dice/drop'
import keep from '../dice/keep'
import reroll from '../dice/reroll'
import rerollOnce from '../dice/rerollOnce'
import roll from '../dice/roll'
import { channels, database, RollResult } from '../utils/cache'

const rollDice: (message: Message) => Promise<void> = async message => {
  const times = /^(roll|r)(\(\d+\)):.*$/gi.test(message.content)
    ? parseInt(message.content.match(/\(\d+/g)?.[0].slice(1) || '1')
    : 1

  if (!Number.isSafeInteger(times) || times < 1 || times > 10) {
    message.channel.send(':x: invalid times of rolling')
    return
  }

  const expression = message.content
    .slice(message.content.indexOf(':') + 1)
    .replace(/\s+/g, '')
    .trim()
  if (!/^([\-\+\/\*]?(\d+(\.\d+)?|\d*d\d+(d\d+|k\d+|r\d+|rk\d+|rc\d+)?))*$/g.test(expression)) {
    message.channel.send(':x: syntax error')
    return
  }
  const diceExpressions = expression.match(/\d*d\d+(d\d+|k\d+|r\d+|rk\d+|rc\d+)?/g) || []
  const diceResults: RollResult[][] = []
  const responseContents: string[] = []

  for (let i = 0; i < times; i++) {
    let resultExpression = expression
    const diceResult: RollResult[] = []

    for (const diceExpression of diceExpressions) {
      let result: RollResult | undefined

      if (/^\d*d\d+$/g.test(diceExpression)) {
        const tmp = diceExpression.split('d')
        result = roll(parseInt(tmp[0]) || 1, parseInt(tmp[1]))
      } else if (/^\d*d\d+d\d+$/g.test(diceExpression)) {
        const tmp = diceExpression.split('d')
        result = drop(parseInt(tmp[0]) || 1, parseInt(tmp[1]), parseInt(tmp[2]))
      } else if (/^\d*d\d+k\d+$/g.test(diceExpression)) {
        const tmp = diceExpression.split(/d|k/)
        result = keep(parseInt(tmp[0]) || 1, parseInt(tmp[1]), parseInt(tmp[2]))
      } else if (/^\d*d\d+r\d+$/g.test(diceExpression)) {
        const tmp = diceExpression.split(/d|r/)
        result = reroll(parseInt(tmp[0]) || 1, parseInt(tmp[1]), parseInt(tmp[2]))
      } else if (/^\d*d\d+rk\d+$/g.test(diceExpression)) {
        const tmp = diceExpression.split(/d|rk/)
        result = rerollOnce(parseInt(tmp[0]) || 1, parseInt(tmp[1]), parseInt(tmp[2]))
      } else if (/^\d*d\d+rc\d+$/g.test(diceExpression)) {
        const tmp = diceExpression.split(/d|rc/)
        result = rerollOnce(parseInt(tmp[0]) || 1, parseInt(tmp[1]), parseInt(tmp[2]), true)
      }

      if (result) {
        resultExpression = resultExpression.replace(diceExpression, `${result.total}`)
        diceResult.push(result)
      }
    }

    diceResults.push(diceResult)
    responseContents.push(
      ':game_die: `EXPRESSION` = `RESULT_EXPRESSION` = **RESULT**'
        .replace('EXPRESSION', expression)
        .replace('RESULT_EXPRESSION', resultExpression)
        .replace('RESULT', `${eval(resultExpression)}`),
    )
  }

  const responseMessage = await message.channel.send(responseContents.join('\n'))
  const logMessage = await channels['logger']?.send({
    embed: {
      author: {
        iconURL: message.author.displayAvatarURL(),
        name: message.author.tag,
      },
      description: 'Message: [Link](MESSAGE_LINK)\nExpression: EXPRESSION\nTimes: TIMES'
        .replace('MESSAGE_LINK', responseMessage.url)
        .replace('EXPRESSION', expression)
        .replace('TIMES', `${times}`),
      fields:
        diceResults
          .map((diceResult, index) => ({
            name: `${index + 1}`,
            value: diceResult
              .map((result, index) =>
                '`DICE_EXPRESSION` = `DICE_ROLLS` = **TOTAL**'
                  .replace('DICE_EXPRESSION', diceExpressions[index])
                  .replace('DICE_ROLLS', JSON.stringify(result.rolls))
                  .replace('TOTAL', `${result.total}`),
              )
              .join('\n'),
          }))
          .filter(field => field.value) || undefined,
    },
  })
  logMessage && (await database.ref(`/diceLogs/${responseMessage.id}`).set(logMessage.id))
}

export default rollDice
