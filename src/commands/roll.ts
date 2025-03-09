import { Embed, MessageFlags, SlashCommandBuilder } from 'discord.js'
import OpenColor from 'open-color' with { type: 'json' }
import { ApplicationCommandProps, ERROR_DESCRIPTIONS } from '../utils/cache.js'
import colorFormatter from '../utils/colorFormatter.js'
import rollDice from '../utils/rollDice.js'
import sendLog from '../utils/sendLog.js'

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
    flags: commandError ? MessageFlags.Ephemeral : undefined,
    withResponse: true,
  })
  const responseMessage = response.resource?.message
  await sendLog(responseMessage, interaction, {
    commandName: 'roll',
    embed: {
      color: colorFormatter(
        commandError ? OpenColor.red[5] : OpenColor.violet[5],
      ),
      description: `
Expression: \`${options.expression}\`
Times: ${options.times}
`.trim(),
      fields: commandError
        ? [
            {
              name: 'Error',
              value: `\`\`\`${commandError}\`\`\``,
            },
          ]
        : logFields,
    },
    isSave: !commandError && logFields.length > 0,
  })
}

export default {
  data,
  execute,
}
