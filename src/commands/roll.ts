import { Embed, SlashCommandBuilder } from 'discord.js'
import OpenColor from 'open-color'
import { CommandProps, ERROR_DESCRIPTIONS, EXPRESSION_REGEXP, channels, database } from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'
import rollDice from '../utils/rollDice'

const data = [
  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('計算一個四則運算的算式，並將其中的骰子語法替換成擲骰結果')
    .addStringOption(option => option.setName('expression').setDescription('包含骰子語法的算式').setRequired(true))
    .addIntegerOption(option => option.setName('repeat').setDescription('重複次數')),
  new SlashCommandBuilder().setName('d6').setDescription('丟擲一顆 6 面骰，並顯示結果'),
  new SlashCommandBuilder().setName('d20').setDescription('丟擲一顆 20 面骰，並顯示結果'),
  new SlashCommandBuilder().setName('d100').setDescription('丟擲一顆 100 面骰，並顯示結果'),
]

const execute: CommandProps = async (request, override) => {
  const options: {
    expression: string
    repeat: number
  } = {
    expression: '',
    repeat: 0,
  }

  if (request.isChatInputCommand()) {
    options.repeat = override?.['repeat'] ?? request.options.getInteger('repeat') ?? 1
    options.expression =
      override?.['expression'] ?? request.options.getString('expression', true).replace(/\s+/g, '').trim()
  } else {
    return
  }

  if (!Number.isSafeInteger(options.repeat) || options.repeat < 1 || options.repeat > 10) {
    await request.reply({
      content: `:x: ${ERROR_DESCRIPTIONS['INVALID_REPEAT']}`,
      ephemeral: true,
    })
    return
  }

  if (!options.expression) {
    await request.reply({
      content: `:x: ${ERROR_DESCRIPTIONS['INVALID_EXPRESSION']}`,
      ephemeral: true,
    })
    return
  }

  if (options.expression.length > 50) {
    await request.reply({
      content: `:x: ${ERROR_DESCRIPTIONS['INVALID_EXPRESSION_LENGTH']}`,
      ephemeral: true,
    })
    return
  }

  EXPRESSION_REGEXP.lastIndex = 0
  if (!EXPRESSION_REGEXP.test(options.expression.replace(/Math\.\w+\(/gi, '(').replace(/[\(\)]/gi, ''))) {
    await request.reply({
      content: `:x: ${ERROR_DESCRIPTIONS['INVALID_EXPRESSION']}`,
      ephemeral: true,
    })
    return
  }

  const responseContents: string[] = [`Roll(**${options.repeat}**): \`${options.expression}\``]
  const logFields: Embed['fields'] = []
  let commandError: Error | undefined = undefined
  try {
    const { diceExpressions, rollResults } = rollDice(options.expression, options.repeat)

    rollResults.forEach((rollResult, i) => {
      let resultExpression = options.expression

      if (diceExpressions.length) {
        logFields.push({
          name: `${i + 1}`,
          value: diceExpressions
            .map(({ content, method }, j) => {
              resultExpression = resultExpression.replace(content, `${rollResult[j].value}`)
              return `\`${content}\` = (${method}) \`${JSON.stringify(rollResult[j].rolls)}\` = **${
                rollResult[j].value
              }**`
            })
            .join('\n'),
        })
      }

      responseContents.push(`:game_die: \`${resultExpression}\` = **${eval(resultExpression)}**`)
    })
  } catch (error: any) {
    commandError = error
  }

  const responseMessage = await request.reply({
    content: commandError
      ? `:x: ${ERROR_DESCRIPTIONS[commandError.message] || ERROR_DESCRIPTIONS['INVALID_EXPRESSION']}`
      : responseContents.join('\n'),
    ephemeral: !!commandError,
    fetchReply: true,
  })
  const logMessage = await channels['logger']?.send({
    embeds: [
      {
        color: colorFormatter(commandError ? OpenColor.red[5] : OpenColor.violet[5]),
        author: {
          icon_url: request.user.displayAvatarURL(),
          name: request.user.tag,
        },
        description: 'Message: [Link]({MESSAGE_LINK})\nExpression: `{EXPRESSION}`\nTimes: {REPEAT}'
          .replace('{MESSAGE_LINK}', responseMessage.url)
          .replace('{EXPRESSION}', options.expression)
          .replace('{REPEAT}', `${options.repeat}`),
        fields: commandError
          ? [
              {
                name: 'Error',
                value: `\`\`\`${commandError}\`\`\``,
              },
            ]
          : logFields,
        timestamp: request.createdAt.toISOString(),
        footer: {
          text: `${responseMessage.createdTimestamp - request.createdTimestamp}ms`,
        },
      },
    ],
  })

  if (logMessage && logMessage.embeds?.[0]?.fields?.length) {
    await database.ref(`/logs/${request.guildId}/${responseMessage.id}`).set(logMessage.id)
  }
}

export default {
  data,
  execute,
}
