require('dotenv').config({
  path: `${__dirname}/../${process.env['NODE_ENV'] === 'development' ? '.env.local' : '.env'}`,
})

import {
  ChannelType,
  Client,
  Events,
  Interaction,
  Message,
  REST,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from 'discord.js'
import { readdirSync } from 'fs'
import OpenColor from 'open-color'
import { join } from 'path'
import { channels } from './utils/cache'
import colorFormatter from './utils/colorFormatter'
import timeFormatter from './utils/timeFormatter'

const client = new Client({
  intents: ['Guilds', 'GuildMessages', 'MessageContent'],
})

// load commands
const commandBuilds: RESTPostAPIApplicationCommandsJSONBody[] = []
type CommandProps = {
  data: RESTPostAPIApplicationCommandsJSONBody[]
  execute: (request: Message<true> | Interaction) => Promise<void>
}
const commands: { [CommandName in string]?: CommandProps['execute'] } = {}

readdirSync(join(__dirname, './commands')).forEach(async filename => {
  if (!filename.endsWith('.js') && !filename.endsWith('.ts')) {
    return
  }
  const commandName = filename.split('.')[0]
  const { default: command }: { default: CommandProps } = await import(join(__dirname, './commands', filename))
  commands[commandName] = command.execute
  commandBuilds.push(...command.data)
})

// handle command
client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.inGuild()) {
    return
  }

  try {
    if (/^(roll|r)(\(\d+\))?:.+/i.test(message.content)) {
      // Roll(Number): Expression
      await commands['rollDice']?.(message)
    } else if (/^(trace|t):/i.test(message.content)) {
      // Trace: Message Search
      await commands['trace']?.(message)
    } else if (/^(pick|p):.+/i.test(message.content)) {
      // Pick: Choice1 Choice2
      await commands['pick']?.(message)
    } else if (/^(poll):.+/i.test(message.content) && /\n/.test(message.content)) {
      // Poll: Question\nChoice 1\nChoice 2
      await commands['poll']?.(message)
    } else if (/^(shuffle|s):.+/i.test(message.content)) {
      // Shuffle: Element1 Element2
      await commands['shuffle']?.(message)
    } else if (/^(help|h): me/i.test(message.content)) {
      // Help: Command
      await commands['help']?.(message)
    }
  } catch (error: any) {
    await message
      .reply(`:fire: 發生未知錯誤，請稍後再試，如果情況還是沒有改善歡迎加入客服群組回報狀況。`)
      .catch(() => {})
    await channels['logger']
      ?.send({
        content: `\`${timeFormatter({ time: message.createdTimestamp })}\` ${message.content}`,
        embeds: [
          {
            color: colorFormatter(OpenColor.red[5]),
            description: `\`\`\`${error.stack}\`\`\``,
          },
        ],
      })
      .catch(() => {})
  }
})

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isMessageContextMenuCommand()) {
    return
  }

  try {
    await commands[interaction.commandName]?.(interaction)
  } catch (error: any) {
    await interaction
      .reply(`:fire: 發生未知錯誤，請稍後再試，如果情況還是沒有改善歡迎加入客服群組回報狀況。`)
      .catch(() => {})
    await channels['logger']
      ?.send({
        content: `\`${timeFormatter({ time: interaction.createdTimestamp })}\` ${interaction}`,
        embeds: [
          {
            color: colorFormatter(OpenColor.red[5]),
            description: `\`\`\`${error.stack}\`\`\``,
          },
        ],
      })
      .catch(() => {})
  }
})

// register commands
client.on(Events.ClientReady, async client => {
  const loggerChannel = client.channels.cache.get(process.env['LOGGER_CHANNEL_ID'] || '')
  if (loggerChannel?.type !== ChannelType.GuildText) {
    console.log(`logger channel not found`)
    process.exit(-1)
  }
  channels['logger'] = loggerChannel
  await loggerChannel.send(`\`${timeFormatter()}\` ${client.user.tag}`)

  const rest = new REST({ version: '10' }).setToken(client.token)
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commandBuilds })
  } catch (error) {
    if (error instanceof Error) {
      await loggerChannel.send(`\`${timeFormatter()}\` Register slash commands error\n\`\`\`${error.stack}\`\`\``)
    }
  }

  setInterval(() => {
    client.user.setActivity('help: me')
  }, 60000)
})

client.login(process.env['TOKEN'])
