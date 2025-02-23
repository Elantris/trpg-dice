import {
  APIEmbed,
  ChannelType,
  Interaction,
  InteractionType,
  Message,
  ThreadChannel,
} from 'discord.js'
import OpenColor from 'open-color' with { type: 'json' }
import { channels, database } from './cache.js'
import colorFormatter from './colorFormatter.js'

const threadChannels: {
  [key in string]?: ThreadChannel
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

  const embed: APIEmbed = {
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
  }

  if (overrideOptions?.isSave) {
    const logMessage = await channels['logger']?.send({
      embeds: [embed],
    })

    if (logMessage && interaction.guildId && responseMessage?.id) {
      await database
        .ref(`/logs/${interaction.guildId}/${responseMessage.id}`)
        .set(`${logMessage.id}`)
    }
  } else {
    if (!threadChannels[commandName]) {
      const threadChannel = channels['logger'].threads.cache.find(
        (v) =>
          v.name === commandName &&
          v.type === ChannelType.PublicThread &&
          !v.locked,
      )
      if (threadChannel) {
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

    await threadChannels[commandName]?.send({
      embeds: [embed],
    })
  }
}

export default sendLog
