require('dotenv').config({
  path: `${__dirname}/../${process.env['NODE_ENV'] === 'development' ? '.env.local' : '.env'}`,
})

import { ChannelType, Client } from 'discord.js'
import OpenColor from 'open-color'
import help from './commands/help'
import luck from './commands/luck'
import pick from './commands/pick'
import poll from './commands/poll'
import rollDice from './commands/rollDice'
import shuffle from './commands/shuffle'
import trace from './commands/trace'
import { channels } from './utils/cache'
import colorFormatter from './utils/colorFormatter'
import timeFormatter from './utils/timeFormatter'

const client = new Client({
  intents: ['Guilds', 'GuildMessages', 'MessageContent'],
})

client.on('messageCreate', async message => {
  if (message.author.bot || !message.inGuild()) {
    return
  }

  try {
    if (/^(roll|r)(\(\d+\))?:.+/i.test(message.content)) {
      // Roll(Number): Expression
      await rollDice(message)
    } else if (/^(trace|t):/i.test(message.content)) {
      // Trace: Message Search
      await trace(message)
    } else if (/^(pick|p):.+/i.test(message.content)) {
      // Pick: Choice1 Choice2
      await pick(message)
    } else if (/^(poll):.+/i.test(message.content) && /\n/.test(message.content)) {
      // Poll: Question\nChoice 1\nChoice 2
      await poll(message)
    } else if (/^(shuffle|s):.+/i.test(message.content)) {
      // Shuffle: Element1 Element2
      await shuffle(message)
    } else if (/^(help|h): me/i.test(message.content)) {
      // Help: Command
      await help(message)
    } else if (
      /^luck:/i.test(message.content) ||
      new RegExp(`<@!{0,1}${message.client.user?.id}>`).test(message.content)
    ) {
      await luck(message)
    }
  } catch (error) {
    await message.channel.send(`:fire: 好像發生了點問題，查看詳細原因：\`t: ${message.id}\``)
    await channels['logger']?.send({
      content: `\`${timeFormatter({ time: message.createdTimestamp })}\` ${message.content}`,
      embeds: [
        {
          color: colorFormatter(OpenColor.red[5]),
          description: `\`\`\`${error}\`\`\``,
        },
      ],
    })
  }
})

client.on('ready', async client => {
  const loggerChannel = client.channels.cache.get(process.env['LOGGER_CHANNEL_ID'] || '')
  if (loggerChannel?.type === ChannelType.GuildText) {
    channels['logger'] = loggerChannel
  }

  setInterval(() => {
    client.user.setActivity('help: me')
  }, 60000)
})

client.login(process.env['TOKEN'])
