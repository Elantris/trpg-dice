import { Message, SlashCommandBuilder } from 'discord.js'
import OpenColor from 'open-color'
import { channels, CommandProps, database } from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'
import notEmpty from '../utils/notEmpty'

const data = [
  new SlashCommandBuilder()
    .setName('pick')
    .setDescription('隨機抽選訊息內容中的其中一個選項。')
    .addStringOption(option => option.setName('choices').setDescription('抽選選項，以空白分隔')),
]

const execute: CommandProps = async request => {
  const options: {
    choices: string[]
  } = {
    choices: [],
  }

  if (request instanceof Message) {
    options.choices = request.content
      .replace(/^(pick|p):/i, '')
      .trim()
      .split(/\s+/)
      .filter(notEmpty)
  } else if (request.isChatInputCommand()) {
    options.choices = request.options.getString('choices', true).trim().split(/\s+/).filter(notEmpty)
  } else {
    return
  }

  if (options.choices.length < 2) {
    await request.reply({
      content: ':x: 抽選選項需要至少兩個',
      ephemeral: true,
    })
    return
  }

  const pickedIndex = Math.floor(Math.random() * options.choices.length)

  const responseMessage = await request.reply({
    content: options.choices[pickedIndex],
    fetchReply: true,
  })
  const logMessage = await channels['logger']?.send({
    embeds: [
      {
        color: colorFormatter(OpenColor.cyan[5]),
        author:
          request instanceof Message
            ? {
                icon_url: request.author.displayAvatarURL(),
                name: request.author.tag,
              }
            : {
                icon_url: request.user.displayAvatarURL(),
                name: request.user.tag,
              },
        description: `Message: [Link](${responseMessage.url})\nChoices: ${options.choices.length}`,
        fields: [
          {
            name: 'Choices',
            value: options.choices.map((v, i) => `${i + 1}. ${v}`).join('\n'),
            inline: true,
          },
          {
            name: 'Picked',
            value: `${pickedIndex + 1}. ${options.choices[pickedIndex]}`,
            inline: true,
          },
        ],
        timestamp: request.createdAt.toISOString(),
        footer: {
          text: `${responseMessage.createdTimestamp - request.createdTimestamp}ms`,
        },
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
