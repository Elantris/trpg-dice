import { MessageFlags, SlashCommandBuilder } from 'discord.js'
import { ApplicationCommandProps } from '../utils/cache.js'
import notEmpty from '../utils/notEmpty.js'
import sendLog from '../utils/sendLog.js'

const data: ApplicationCommandProps['data'] = [
  new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('將一連串項目以隨機順序排列')
    .addStringOption((option) =>
      option
        .setName('items')
        .setDescription('排列項目，以空白分隔')
        .setRequired(true),
    ),
]

const execute: ApplicationCommandProps['execute'] = async (interaction) => {
  const options: {
    items: string[]
  } = {
    items: [],
  }

  if (interaction.isChatInputCommand()) {
    options.items = interaction.options
      .getString('items', true)
      .trim()
      .split(/\s+/)
      .filter(notEmpty)
  } else {
    return
  }

  if (options.items.length < 2) {
    await interaction.reply({
      content: ':x: 排列項目需要至少兩個',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const orders: number[] = Array.from(
    { length: options.items.length },
    (_, i) => i,
  )
  for (let i = orders.length - 1; i !== 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[orders[i], orders[j]] = [orders[j], orders[i]]
  }

  const response = await interaction.reply({
    content: `:game_die: Shuffle(**${options.items.length}**):\n${orders
      .map((order) => options.items[order])
      .join(' ')}`,
    withResponse: true,
    allowedMentions: {
      parse: [],
    },
  })
  const responseMessage = response.resource?.message
  await sendLog(responseMessage, interaction, {
    embed: {
      description: `Count: ${options.items.length}`,
      fields: [
        {
          name: 'Input',
          value: options.items
            .map((element, index) => `\`${index + 1}:\` ${element}`)
            .join('\n'),
          inline: true,
        },
        {
          name: 'Result',
          value: orders
            .map((order) => `\`${order + 1}:\` ${options.items[order]}`)
            .join('\n'),
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
