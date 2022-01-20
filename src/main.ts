import { Client, TextChannel } from 'discord.js'
import { config } from 'dotenv'
import OpenColor from 'open-color'
import { join } from 'path'
import help from './commands/help'
import rollDice from './commands/rollDice'
import trace from './commands/trace'
import { channels } from './utils/cache'
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
    } else if (/^(roll|r)(\(\d+\))?:.*$/gi.test(message.content)) {
      // Roll(Number): Expression
      await rollDice(message)
    } else if (/^(trace|t):.*$/gi.test(message.content)) {
      // Trace: Message Search
      await trace(message)
    }
  } catch (error) {
    message.channel.send(':fire: 好像發生了點問題')
    channels['logger']?.send({
      content: '`TIME` CONTENT'
        .replace('TIME', timeFormatter({ time: message.createdTimestamp }))
        .replace('CONTENT', message.content),
      embeds: [
        {
          color: parseInt(OpenColor.red[5].replace('#', '0x')),
          description: '```ERROR```'.replace('ERROR', `${error}`),
        },
      ],
    })
  }
})

client.on('ready', async () => {
  const loggerChannel = client.channels.cache.get(process.env['LOGGER_CHANNEL_ID'] || '')
  if (loggerChannel instanceof TextChannel) {
    channels['logger'] = loggerChannel
  }
  channels['logger']?.send(`\`${timeFormatter()}\` ${client.user?.tag}`)
})

client.login(process.env['TOKEN'])
