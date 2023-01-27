import { Message } from 'discord.js'
import OpenColor from 'open-color'
import { channels, database } from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'
import notEmpty from '../utils/notEmpty'

const pick: (message: Message<true>) => Promise<void> = async message => {
  const choices = message.content
    .replace(/^(pick|p):/i, '')
    .trim()
    .split(/\s+/)
    .filter(notEmpty)

  if (choices.length < 2) {
    return
  }

  const pickedIndex = Math.floor(Math.random() * choices.length)

  const responseMessage = await message.channel.send(choices[pickedIndex])
  const logMessage = await channels['logger']?.send({
    embeds: [
      {
        color: colorFormatter(OpenColor.cyan[5]),
        author: {
          icon_url: message.author.displayAvatarURL(),
          name: message.author.tag,
        },
        description: 'Message: [Link]({MESSAGE_LINK})\nChoices: {COUNT}'
          .replace('{MESSAGE_LINK}', message.url)
          .replace('{COUNT}', `${choices.length}`),
        fields: [
          {
            name: 'Choices',
            value: choices.map((v, i) => `${i + 1}. ${v}`).join('\n'),
            inline: true,
          },
          {
            name: 'Picked',
            value: `${pickedIndex + 1}. ${choices[pickedIndex]}`,
            inline: true,
          },
        ],
        timestamp: message.createdAt.toISOString(),
        footer: {
          text: `${responseMessage.createdTimestamp - message.createdTimestamp}ms`,
        },
      },
    ],
  })

  if (logMessage) {
    await database.ref(`/logs/${message.guildId}/${responseMessage.id}`).set(logMessage.id)
  }
}

export default pick
