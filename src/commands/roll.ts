import { Embed, SlashCommandBuilder } from 'discord.js'
import OpenColor from 'open-color'
import {
  ERROR_DESCRIPTIONS,
  channels,
  database,
  type ApplicationCommandProps,
} from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'
import rollDice from '../utils/rollDice'

const data: ApplicationCommandProps['data'] = [
  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('計算一個四則運算的算式，並將其中的骰子語法替換成擲骰結果')
    .addStringOption((option) =>
      option
        .setName('expression')
        .setDescription('包含骰子語法的算式')
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('times').setDescription('計算次數'),
    ),
  new SlashCommandBuilder()
    .setName('d4')
    .setDescription('丟擲一顆 4 面骰，並顯示結果'),
  new SlashCommandBuilder()
    .setName('d6')
    .setDescription('丟擲一顆 6 面骰，並顯示結果'),
  new SlashCommandBuilder()
    .setName('d8')
    .setDescription('丟擲一顆 8 面骰，並顯示結果'),
  new SlashCommandBuilder()
    .setName('d12')
    .setDescription('丟擲一顆 12 面骰，並顯示結果'),
  new SlashCommandBuilder()
    .setName('d20')
    .setDescription('丟擲一顆 20 面骰，並顯示結果'),
  new SlashCommandBuilder()
    .setName('d100')
    .setDescription(
      '丟擲兩顆 10 面骰，分別代表十位數、個位數，顯示 1~100 的結果',
    ),
]

const execute: ApplicationCommandProps['execute'] = async (
  interaction,
  overrideOptions,
) => {
  const options: {
    expression: string
    times: number
  } = {
    expression: '',
    times: 1,
  }

  if (interaction.isChatInputCommand()) {
    options.times =
      overrideOptions?.['times'] ?? interaction.options.getInteger('times') ?? 1
    options.expression = (
      overrideOptions?.['expression'] ??
      interaction.options.getString('expression', true)
    )
      .replace(/\s+/g, '')
      .trim()
  } else {
    return
  }

  const responseContents: string[] = [
    `Roll(**${options.times}**): \`${options.expression}\``,
  ]
  const logFields: Embed['fields'] = []
  let commandError: Error | undefined = undefined

  try {
    const { diceExpressions, rollResults } = rollDice(
      options.expression,
      options.times,
    )

    rollResults.forEach((rollResult, i) => {
      let resultExpression = options.expression

      if (diceExpressions.length) {
        logFields.push({
          name: `${i + 1}`,
          value: diceExpressions
            .map(({ content, name }, j) => {
              resultExpression = resultExpression.replace(
                content,
                `${rollResult[j].value}`,
              )
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

  const response = await interaction.reply({
    content: commandError
      ? `:x: ${ERROR_DESCRIPTIONS[commandError.message] || ERROR_DESCRIPTIONS['INVALID_EXPRESSION']}`
      : responseContents.join('\n'),
    ephemeral: !!commandError,
    withResponse: true,
  })
  const responseMessage = response.resource?.message
  const logMessage = await channels['logger'].send({
    embeds: [
      {
        color: colorFormatter(
          commandError ? OpenColor.red[5] : OpenColor.violet[5],
        ),
        author: {
          icon_url: interaction.user.displayAvatarURL(),
          name: interaction.user.tag,
        },
        description: `Message: [Link](${responseMessage?.url})\nExpression: \`${options.expression}\`\nTimes: ${options.times}`,
        fields: commandError
          ? [
              {
                name: 'Error',
                value: `\`\`\`${commandError}\`\`\``,
              },
            ]
          : logFields,
        timestamp: interaction.createdAt.toISOString(),
        footer: {
          text: `${(responseMessage?.createdTimestamp || Date.now()) - interaction.createdTimestamp}ms`,
        },
      },
    ],
  })
  if (responseMessage && logMessage.embeds?.[0]?.fields?.length) {
    await database
      .ref(`/logs/${interaction.guildId}/${responseMessage.id}`)
      .set(logMessage.id)
  }
}

export default {
  data,
  execute,
}
