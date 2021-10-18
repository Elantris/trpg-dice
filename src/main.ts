import { Client, TextChannel } from 'discord.js'
import { config } from 'dotenv'
import { join } from 'path'
import rollDice from './commands/rollDice'
import trace from './commands/trace'
import { channels } from './utils/cache'
import timeFormatter from './utils/timeFormatter'

config({
  path: join(__dirname, '..', process.env['NODE_ENV'] === 'development' ? '.env.local' : '.env'),
})

const client = new Client()

client.on('message', async message => {
  if (message.author.bot) {
    return
  }

  try {
    if (new RegExp(`^<@!{0,1}${message.client.user?.id}>$`).test(message.content)) {
      await message.channel.send(':game_die: Prefix', {
        embed: {
          fields: [
            {
              name: 'Roll',
              value: '`Roll(Number): Expression`\nr: Expression',
            },
            {
              name: 'Trace',
              value: '`Trace: Message URL`\n`t: Message ID`',
            },
          ],
        },
      })
    } else if (/^(roll|r)(\(\d+\))?:.*$/gi.test(message.content)) {
      // Roll(Number): Expression
      await rollDice(message)
    } else if (/^(trace|t):.*$/gi.test(message.content)) {
      // Trace: Message Search
      await trace(message)
    }
  } catch (error) {
    message.channel.send(':fire: something went wrong')
    channels['logger']?.send(
      '`TIME` CONTENT'
        .replace('TIME', timeFormatter({ time: message.createdTimestamp }))
        .replace('CONTENT', message.content),
      {
        embed: {
          description: '```ERROR```'.replace('ERROR', `${error}`),
        },
      },
    )
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
