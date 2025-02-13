import {
  APIEmbed,
  ChannelType,
  Interaction,
  InteractionType,
  Message,
  PublicThreadChannel,
} from 'discord.js'
import OpenColor from 'open-color'
import { channels, database } from './cache'
import colorFormatter from './colorFormatter'

const threadChannels: {
  [key in string]?: PublicThreadChannel
} = {}

const colors: {
  [command in string]?: number
} = {
  game: colorFormatter(OpenColor.orange[5]),
  luck: colorFormatter(OpenColor.yellow[5]),
  pick: colorFormatter(OpenColor.cyan[5]),
  roll: colorFormatter(OpenColor.violet[5]),
  shuffle: colorFormatter(OpenColor.teal[5]),
}

const sendLog = async (
  responseMessage: Message | null | undefined,
  interaction: Interaction,
  overrideOptions?: {
    commandName?: string
    embed: APIEmbed
    isSave?: boolean
  },
) => {
  const commandName =
    overrideOptions?.commandName ??
    (interaction.type === InteractionType.MessageComponent
      ? interaction.customId.split('_')[0]
      : interaction.type === InteractionType.ApplicationCommand
        ? interaction.commandName
        : '')
  if (!commandName) {
    return
  }

  if (!threadChannels[commandName]) {
    const threadChannel = channels['logger'].threads.cache.find(
      (v) => v.name === commandName && v.type === ChannelType.PublicThread,
    )
    if (
      threadChannel?.type === ChannelType.PublicThread &&
      !threadChannel.locked
    ) {
      threadChannels[commandName] = threadChannel
    } else {
      const threadChannel = await channels['logger'].threads.create({
        name: commandName,
      })

      if (threadChannel.type === ChannelType.PublicThread) {
        threadChannels[commandName] = threadChannel
      }
    }
  }

  const logMessage = await threadChannels[commandName]?.send({
    embeds: [
      {
        color: colors[commandName],
        author: {
          icon_url: interaction.user.displayAvatarURL(),
          name: interaction.user.tag,
        },
        timestamp: interaction.createdAt.toISOString(),
        footer: {
          text: `${(responseMessage?.createdTimestamp || Date.now()) - interaction.createdTimestamp}ms`,
        },
        ...(overrideOptions?.embed || {}),
      },
    ],
  })

  if (
    overrideOptions?.isSave &&
    logMessage &&
    interaction.guildId &&
    responseMessage?.id
  ) {
    await database
      .ref(`/logs/${interaction.guildId}/${responseMessage.id}`)
      .set(`${logMessage.id},${commandName}`)
  }
}

export default sendLog
