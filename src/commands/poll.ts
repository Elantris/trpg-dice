import { Message, SlashCommandBuilder } from 'discord.js'
import OpenColor from 'open-color'
import { CommandProps } from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'
import notEmpty from '../utils/notEmpty'

const data = [
  new SlashCommandBuilder()
    .setName('poll')
    .setDescription('建立一則用表情符號投票的訊息')
    .addStringOption(option => option.setName('title').setDescription('標題').setRequired(true))
    .addStringOption(option => option.setName('choices').setDescription('投票選項，以空白分隔').setRequired(true)),
]

const choiceEmojis: string[] = '🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇱 🇲 🇳 🇴 🇵 🇶 🇷 🇸 🇹 🇺 🇻 🇼 🇽 🇾 🇿'.split(
  ' ',
)

const execute: CommandProps = async request => {
  const options: {
    title: string
    choices: string[]
  } = {
    title: '',
    choices: [],
  }
  if (request instanceof Message) {
    options.choices = request.content.split('\n').filter(notEmpty)
    options.title = options.choices
      .splice(0, 1)[0]
      .replace(/^(poll):/i, '')
      .trim()
  } else if (request.isChatInputCommand()) {
    options.title = request.options.getString('title', true)
    options.choices = request.options.getString('choices', true).split(/\s+/).filter(notEmpty)
  } else {
    return
  }

  if (options.choices.length < 2) {
    await request.reply(':x: 投票選項需要至少兩個')
    return
  }
  if (options.choices.length > choiceEmojis.length) {
    await request.reply(':x: 選項數量過多')
    return
  }

  if (!request.guild?.members.cache.get(request.client.user.id)?.permissionsIn(request.channelId).has('AddReactions')) {
    await request.reply(':lock: 機器人需要「加入反應」的權限')
    return
  }

  const responseMessage = await request.reply({
    content: `:bar_chart: ${options.title}`,
    embeds: [
      {
        color: colorFormatter(OpenColor.blue[5]),
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
        description: options.choices.map((choice, index) => `${choiceEmojis[index]} ${choice}`).join('\n'),
      },
    ],
    fetchReply: true,
  })

  for (const i in options.choices) {
    await responseMessage.react(choiceEmojis[i])
  }
}

export default {
  data,
  execute,
}
