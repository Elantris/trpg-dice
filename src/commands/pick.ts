import { MessageFlags, SlashCommandBuilder } from 'discord.js'
import { ApplicationCommandProps } from '../utils/cache.js'
import notEmpty from '../utils/notEmpty.js'
import sendLog from '../utils/sendLog.js'

const data: ApplicationCommandProps['data'] = [
  new SlashCommandBuilder()
    .setName('pick')
    .setDescription('隨機抽選訊息內容中的其中一個選項。')
    .addStringOption((option) =>
      option
        .setName('choices')
        .setDescription('抽選選項，以空白分隔')
        .setRequired(true),
    ),
]

const execute: ApplicationCommandProps['execute'] = async (interaction) => {
  const options: {
    choices: string[]
  } = {
    choices: [],
  }

  if (interaction.isChatInputCommand()) {
    options.choices = interaction.options
      .getString('choices', true)
      .trim()
      .split(/\s+/)
      .filter(notEmpty)
  } else {
    return
  }

  if (options.choices.length < 2) {
    await interaction.reply({
      content: ':x: 抽選選項需要至少兩個',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const pickedIndex = Math.floor(Math.random() * options.choices.length)

  const response = await interaction.reply({
    content: `:game_die: Pick(**${options.choices.length}**):\n${options.choices[pickedIndex]}`,
    withResponse: true,
  })
  const responseMessage = response.resource?.message
  await sendLog(responseMessage, interaction, {
    embed: {
      description: `Message: [Link](${responseMessage?.url})\nChoices: ${options.choices.length}`,
      fields: [
        {
          name: 'Choices',
          value: options.choices.map((v, i) => `\`${i + 1},\` ${v}`).join('\n'),
          inline: true,
        },
        {
          name: 'Picked',
          value: `\`${pickedIndex + 1},\` ${options.choices[pickedIndex]}`,
          inline: true,
        },
      ],
    },
    isSave: !!responseMessage,
  })
}

export default {
  data,
  execute,
}
