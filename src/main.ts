import { Client, TextChannel } from 'discord.js'
import { config } from 'dotenv'
import OpenColor from 'open-color'
import { join } from 'path'
import help from './commands/help'
import pick from './commands/pick'
import poll from './commands/poll'
import rollDice from './commands/rollDice'
import trace from './commands/trace'
import { channels } from './utils/cache'
import colorFormatter from './utils/colorFormatter'
import timeFormatter from './utils/timeFormatter'

config({
  path: join(__dirname, '..', process.env['NODE_ENV'] === 'development' ? '.env.local' : '.env'),
})

const client = new Client({
  intents: (1 << 12) - 1,
})

client.on('messageCreate', async message => {
  if (message.author.bot) {
    return
  }

  try {
    if (new RegExp(`^<@!{0,1}${message.client.user?.id}>$`).test(message.content)) {
      // <@!898765970267570186>
      await help(message)
    } else if (/^(roll|r)(\(\d+\))?:/i.test(message.content)) {
      // Roll(Number): Expression
      await rollDice(message)
    } else if (/^(trace|t):/i.test(message.content)) {
      // Trace: Message Search
      await trace(message)
    } else if (/^(poll):/i.test(message.content) && /\n/.test(message.content)) {
      // Poll: Question\nChoice 1\nChoice 2
      await poll(message)
    } else if (/^(pick|p):/i.test(message.content)) {
      // Pick: choice1 choice2
      await pick(message)
    }
  } catch (error) {
    message.channel.send(':fire: 好像發生了點問題')
    channels['logger']?.send({
      content: '`TIME` CONTENT'
        .replace('TIME', timeFormatter({ time: message.createdTimestamp }))
        .replace('CONTENT', message.content),
      embeds: [
        {
          color: colorFormatter(OpenColor.red[5]),
          description: '```ERROR```'.replace('ERROR', `${error}`),
        },
      ],
    })
  }
})

client.on('ready', async () => {
  client.user?.setActivity('2022.02.08')
  const loggerChannel = client.channels.cache.get(process.env['LOGGER_CHANNEL_ID'] || '')
  if (loggerChannel instanceof TextChannel) {
    channels['logger'] = loggerChannel
  }
})

client.login(process.env['TOKEN'])
