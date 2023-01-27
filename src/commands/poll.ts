import { Message } from 'discord.js'
import OpenColor from 'open-color'
import colorFormatter from '../utils/colorFormatter'

const choiceEmojis: string[] = '🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇱 🇲 🇳 🇴 🇵 🇶 🇷 🇸 🇹 🇺 🇻 🇼 🇽 🇾 🇿'.split(
  ' ',
)

const poll: (message: Message<true>) => Promise<void> = async message => {
  const choices = message.content.split('\n').filter(v => v)
  const question = choices
    .splice(0, 1)[0]
    .replace(/^(poll):/i, '')
    .trim()

  if (choices.length < 2) {
    return
  }
  if (choices.length > choiceEmojis.length) {
    await message.channel.send(':x: 選項數量過多')
    return
  }

  if (!message.guild.members.cache.get(message.client.user.id)?.permissionsIn(message.channel).has('AddReactions')) {
    await message.channel.send(':lock: 機器人需要「加入反應」的權限')
    return
  }

  const responseMessage = await message.channel.send({
    content: `:bar_chart: ${question}`,
    embeds: [
      {
        color: colorFormatter(OpenColor.blue[5]),
        author: {
          icon_url: message.author.displayAvatarURL(),
          name: message.author.tag,
        },
        description: choices.map((choice, index) => `${choiceEmojis[index]} ${choice}`).join('\n'),
      },
    ],
  })

  for (const i in choices) {
    await responseMessage.react(choiceEmojis[i])
  }

  try {
    await message.delete()
  } catch {}
}

export default poll
