require('dotenv').config({
  path: `${__dirname}/../${process.env['NODE_ENV'] === 'development' ? '.env.local' : '.env'}`,
})

import { ChannelType, Client, Events, REST, RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord.js'
import { readdirSync } from 'fs'
import OpenColor from 'open-color'
import { join } from 'path'
import { CommandProps, channels, database } from './utils/cache'
import colorFormatter from './utils/colorFormatter'
import timeFormatter from './utils/timeFormatter'

const client = new Client({
  intents: ['Guilds'],
})

// load commands
const commandBuilds: RESTPostAPIApplicationCommandsJSONBody[] = []
type ApplicationCommandProps = {
  data: RESTPostAPIApplicationCommandsJSONBody[]
  execute: CommandProps
}
const commands: { [CommandName in string]?: ApplicationCommandProps['execute'] } = {}

readdirSync(join(__dirname, './commands')).forEach(async filename => {
  if (!filename.endsWith('.js') && !filename.endsWith('.ts')) {
    return
  }
  const commandName = filename.split('.')[0]
  const { default: command }: { default: ApplicationCommandProps } = await import(
    join(__dirname, './commands', filename)
  )
  commands[commandName] = command.execute
  commandBuilds.push(...command.data)
})

// handle command
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand() || interaction.isMessageContextMenuCommand()) {
    try {
      let commandName = interaction.commandName
      let override: any = undefined
      if (interaction.commandName === 'd6' || interaction.commandName === 'd20' || interaction.commandName === 'd100') {
        commandName = 'roll'
        override = {
          expression: interaction.commandName,
        }
      }
      await commands[commandName]?.(interaction, override)
    } catch (error: any) {
      await interaction
        .reply(`:fire: 發生未知錯誤，請稍後再試，如果情況還是沒有改善歡迎加入客服群組回報狀況。`)
        .catch(() => {})

      if (error instanceof Error) {
        await channels['logger']
          ?.send({
            content: `\`${timeFormatter({ time: interaction.createdTimestamp })}\` ${
              interaction.isChatInputCommand()
                ? interaction
                : `/${interaction.commandName} ${interaction.targetMessage.url} (Context Menu)`
            }`,
            embeds: [
              {
                color: colorFormatter(OpenColor.red[5]),
                description: `\`\`\`${error.stack}\`\`\``,
              },
            ],
          })
          .catch(() => {})
      }
    }
  }
})

// handle guild delete
client.on(Events.GuildDelete, async guild => {
  await database.ref(`/logs/${guild.id}`).remove()
})

// register commands
client.on(Events.ClientReady, async client => {
  const loggerChannel = client.channels.cache.get(process.env['LOGGER_CHANNEL_ID'] || '')
  if (loggerChannel?.type !== ChannelType.GuildText) {
    console.log(`logger channel not found`)
    process.exit(-1)
  }
  channels['logger'] = loggerChannel

  const rest = new REST({ version: '10' }).setToken(client.token)
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commandBuilds })
  } catch (error) {
    if (error instanceof Error) {
      await loggerChannel.send(`\`${timeFormatter()}\` Register slash commands error\n\`\`\`${error.stack}\`\`\``)
    }
  }

  await loggerChannel.send(`\`${timeFormatter()}\` ${client.user.tag}`)

  setInterval(() => {
    client.user.setActivity(`on ${client.guilds.cache.size} guilds.`)
  }, 10000)
})

client.login(process.env['TOKEN'])
