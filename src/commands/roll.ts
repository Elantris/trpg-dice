import { Embed, SlashCommandBuilder } from 'discord.js'
import OpenColor from 'open-color'
import { ApplicationCommandProps, ERROR_DESCRIPTIONS, channels, database } from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'
import rollDice from '../utils/rollDice'

const data: ApplicationCommandProps['data'] = [
  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('計算一個四則運算的算式，並將其中的骰子語法替換成擲骰結果')
    .setDMPermission(false)
    .addStringOption((option) => option.setName('expression').setDescription('包含骰子語法的算式').setRequired(true))
    .addIntegerOption((option) => option.setName('times').setDescription('計算次數')),
  new SlashCommandBuilder().setName('d4').setDescription('丟擲一顆 4 面骰，並顯示結果').setDMPermission(false),
  new SlashCommandBuilder().setName('d6').setDescription('丟擲一顆 6 面骰，並顯示結果').setDMPermission(false),
  new SlashCommandBuilder().setName('d8').setDescription('丟擲一顆 8 面骰，並顯示結果').setDMPermission(false),
  new SlashCommandBuilder().setName('d12').setDescription('丟擲一顆 12 面骰，並顯示結果').setDMPermission(false),
  new SlashCommandBuilder().setName('d20').setDescription('丟擲一顆 20 面骰，並顯示結果').setDMPermission(false),
  new SlashCommandBuilder()
    .setName('d100')
    .setDescription('丟擲一顆公正骰子，總之它有 100 個面，顯示面朝上的數字')
    .setDMPermission(false),
]

const execute: ApplicationCommandProps['execute'] = async (request, overrideOptions) => {
  const options: {
    expression: string
    times: number
  } = {
    expression: '',
    times: 1,
  }

  if (request.isChatInputCommand()) {
    options.times = overrideOptions?.['times'] ?? request.options.getInteger('times') ?? 1
    options.expression =
      overrideOptions?.['expression'] ?? request.options.getString('expression', true).replace(/\s+/g, '').trim()
  } else {
    return
  }

  const responseContents: string[] = [`Roll(**${options.times}**): \`${options.expression}\``]
  const logFields: Embed['fields'] = []
  let commandError: Error | undefined = undefined

  try {
    const { diceExpressions, rollResults } = rollDice(options.expression, options.times)

    rollResults.forEach((rollResult, i) => {
      let resultExpression = options.expression

      if (diceExpressions.length) {
        logFields.push({
          name: `${i + 1}`,
          value: diceExpressions
            .map(({ content, name }, j) => {
              resultExpression = resultExpression.replace(content, `${rollResult[j].value}`)
              return `\`${content}\` = (${name}) \`${JSON.stringify(rollResult[j].rolls)}\` = **${
                rollResult[j].value
              }**`
            })
            .join('\n'),
        })
      }

      responseContents.push(
        `${diceExpressions.length ? ':game_die:' : ':pencil:'} \`${resultExpression}\` = **${eval(resultExpression)}**`,
      )
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
  const logMessage = await channels['logger'].send({
    embeds: [
      {
        color: colorFormatter(commandError ? OpenColor.red[5] : OpenColor.violet[5]),
        author: {
          icon_url: request.user.displayAvatarURL(),
          name: request.user.tag,
        },
        description: `Message: [Link](${responseMessage.url})\nExpression: \`${options.expression}\`\nTimes: ${options.times}`,
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
