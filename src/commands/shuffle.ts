import { SlashCommandBuilder } from 'discord.js'
import OpenColor from 'open-color'
import { CommandProps, channels, database } from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'
import notEmpty from '../utils/notEmpty'

const data = [
  new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('將一連串項目以隨機順序排列')
    .addStringOption(option => option.setName('items').setDescription('排列項目，以空白分隔').setRequired(true)),
]

const execute: CommandProps = async request => {
  const options: {
    items: string[]
  } = {
    items: [],
  }

  if (request.isChatInputCommand()) {
    options.items = request.options.getString('items', true).split(/\s+/).filter(notEmpty)
  } else {
    return
  }

  if (options.items.length < 2) {
    await request.reply({
      content: ':x: 排列項目需要至少兩個',
      ephemeral: true,
    })
    return
  }

  const orders: number[] = []
  options.items.forEach((v, i) => orders.push(i))
  for (let i = orders.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[orders[i], orders[j]] = [orders[j], orders[i]]
  }

  const responseMessage = await request.reply({
    content: orders.map(order => options.items[order]).join(' '),
    fetchReply: true,
  })
  const logMessage = await channels['logger']?.send({
    embeds: [
      {
        color: colorFormatter(OpenColor.teal[5]),
        author: {
          icon_url: request.user.displayAvatarURL(),
          name: request.user.tag,
        },
        description: `Message: [Link](${responseMessage.url})\nCount: ${options.items.length}`,
        fields: [
          {
            name: 'Input',
            value: options.items.map((element, index) => `\`${index + 1}.\` ${element}`).join('\n'),
            inline: true,
          },
          {
            name: 'Result',
            value: orders.map(order => `\`${order + 1}.\` ${options.items[order]}`).join('\n'),
            inline: true,
          },
        ],
      },
    ],
  })

  if (logMessage) {
    await database.ref(`/logs/${request.guildId}/${responseMessage.id}`).set(logMessage.id)
  }
}
export default {
  data,
  execute,
}
