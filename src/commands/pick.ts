import { Message } from 'discord.js'
import OpenColor from 'open-color'
import { channels, database } from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'

const pick: (message: Message) => Promise<void> = async message => {
  const choices = message.content
    .replace(/^(pick|p):/i, '')
    .trim()
    .split(/\s+/)

  if (!choices.length) {
    return
  }

  const pickedChoice = choices[Math.floor(Math.random() * choices.length)]

  const responseMessage = await message.channel.send(pickedChoice)
  const logMessage = await channels['logger']?.send({
    embeds: [
      {
        color: colorFormatter(OpenColor.cyan[5]),
        author: {
          iconURL: message.author.displayAvatarURL(),
          name: message.author.tag,
        },
        description: 'Message: [Link](MESSAGE_LINK)\nChoices: COUNT'
          .replace('MESSAGE_LINK', message.url)
          .replace('COUNT', `${choices.length}`),
        fields: [
          {
            name: 'Choices',
            value: choices.map((v, i) => `${i + 1}. ${v}`).join('\n'),
            inline: true,
          },
          {
            name: 'Picked',
            value: pickedChoice,
            inline: true,
          },
        ],
        timestamp: message.createdAt,
        footer: {
          text: `${responseMessage.createdTimestamp - message.createdTimestamp}ms`,
        },
      },
    ],
  })

  logMessage && database.ref(`/logs/${responseMessage.id}`).set(logMessage.id)
}

export default pick
