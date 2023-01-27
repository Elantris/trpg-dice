import { Message } from 'discord.js'
import OpenColor from 'open-color'
import randomInt from '../dice/randomInt'
import { channels, database } from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'
import notEmpty from '../utils/notEmpty'

const shuffle = async (message: Message<true>) => {
  const elements = message.content
    .replace(/^(shuffle|s):/i, '')
    .trim()
    .split(/\s+/)
    .filter(notEmpty)

  if (elements.length < 2) {
    return
  }

  const orders = [...new Array(elements.length).keys()]
  for (let i = 0; i < orders.length - 1; i++) {
    const j = randomInt(i, orders.length - 1)
    ;[orders[i], orders[j]] = [orders[j], orders[i]]
  }

  const responseMessage = await message.channel.send(orders.map(order => elements[order]).join(' '))
  const logMessage = await channels['logger']?.send({
    embeds: [
      {
        color: colorFormatter(OpenColor.teal[5]),
        author: {
          icon_url: message.author.displayAvatarURL(),
          name: message.author.tag,
        },
        description: `Message: [Link](${message.url})\nCount: ${elements.length}`,
        fields: [
          {
            name: 'Input',
            value: elements.map((element, index) => `${index + 1}. ${element}`).join('\n'),
            inline: true,
          },
          {
            name: 'Result',
            value: orders.map(order => `${order + 1}. ${elements[order]}`).join('\n'),
            inline: true,
          },
        ],
      },
    ],
  })
  if (logMessage) {
    await database.ref(`/logs/${message.guildId}/${responseMessage.id}`).set(logMessage.id)
  }
}
export default shuffle
