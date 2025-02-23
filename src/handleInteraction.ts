import {
  Client,
  InteractionType,
  MessageFlags,
  REST,
  Routes,
  type CacheType,
  type Interaction,
  type RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js'
import { readdirSync } from 'fs'
import OpenColor from 'open-color'
import { join } from 'path'
import { channels, type ApplicationCommandProps } from './utils/cache'
import colorFormatter from './utils/colorFormatter'
import timeFormatter from './utils/timeFormatter'

// register commands
const commands: {
  [CommandName in string]?: ApplicationCommandProps['execute']
} = {}

export const registerCommands = async (client: Client<true>) => {
  const body: RESTPostAPIApplicationCommandsJSONBody[] = []

  for (const filename of readdirSync(join(__dirname, './commands'))) {
    if (!filename.endsWith('.js') && !filename.endsWith('.ts')) {
      continue
    }
    const commandName = filename.split('.')[0]
    const { default: command }: { default?: Partial<ApplicationCommandProps> } =
      await import(join(__dirname, './commands', filename))
    if (command?.execute && command.data) {
      commands[commandName] = command.execute
      command.data.forEach((v) => body.push(v.toJSON()))
    }
  }

  const rest = new REST({ version: '10' }).setToken(client.token)
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body })
  } catch (error) {
    await channels['logger'].send(
      `\`${timeFormatter()}\` Register slash commands error\n\`\`\`${
        error instanceof Error ? error.stack : error
      }\`\`\``,
    )
  }
}

// handle commands
const lastUsedAt: { [UserID in string]?: number } = {}
const handleInteraction = async (interaction: Interaction<CacheType>) => {
  if (
    !interaction.guildId ||
    interaction.type === InteractionType.ApplicationCommandAutocomplete ||
    interaction.type === InteractionType.ModalSubmit
  ) {
    return
  }

  if (
    interaction.createdTimestamp - (lastUsedAt[interaction.user.id] ?? 0) <
    3000
  ) {
    if (interaction.type === InteractionType.MessageComponent) {
      return
    }
    await interaction.reply({
      content: ':ice_cube:',
      flags: MessageFlags.Ephemeral,
      withResponse: true,
    })
    return
  }
  lastUsedAt[interaction.user.id] = interaction.createdTimestamp

  try {
    let commandName =
      interaction.type === InteractionType.MessageComponent
        ? interaction.customId.split('_')[0]
        : interaction.commandName
    let overrideOptions: Record<string, any> | undefined = undefined
    if (/^d\d+$/.test(commandName)) {
      overrideOptions = {
        expression: commandName,
      }
      commandName = 'roll'
    }
    await commands[commandName]?.(interaction, overrideOptions)
  } catch (error: any) {
    await interaction
      .reply({
        content: `:fire: 發生未知錯誤，請稍後再試，如果情況還是沒有改善歡迎加入客服群組回報狀況。`,
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => {})

    await channels['logger']
      .send({
        content: `\`${timeFormatter({ time: interaction.createdTimestamp })}\` ${
          interaction.type === InteractionType.MessageComponent
            ? interaction.customId
            : interaction.isMessageContextMenuCommand()
              ? `/${interaction.commandName} ${interaction.targetMessage.url} (Context Menu)`
              : interaction
        }`,
        embeds: [
          {
            color: colorFormatter(OpenColor.red[5]),
            description: `\`\`\`${error instanceof Error ? error.stack : error}\`\`\``,
          },
        ],
      })
      .catch(() => {})
  }
}

export default handleInteraction
