import { ChannelType, Client } from 'discord.js'
import appConfig from './appConfig.js'
import { registerCommands } from './handleInteraction.js'
import {
  botData,
  channels,
  database,
  guildConfigs,
  updatedMemberCoins,
} from './utils/cache.js'
import timeFormatter from './utils/timeFormatter.js'

const handleReady = async (client: Client<true>) => {
  const loggerChannel = client.channels.cache.get(appConfig.LOGGER_CHANNEL_ID)
  if (loggerChannel?.type !== ChannelType.GuildText) {
    console.log(`logger channel not found`)
    process.exit(-1)
  }
  channels['logger'] = loggerChannel

  await registerCommands(client)

  await database.ref('/configs').once('value', (snapshot) => {
    const data = snapshot.val() || {}
    for (const guildId in data) {
      guildConfigs[guildId] = data[guildId]
    }
  })

  // bot client ready
  botData.readyAt = Date.now()
  await channels['logger'].send(
    `\`${timeFormatter({ time: botData.readyAt })}\` ${client.user.tag}`,
  )

  // bot activity
  setInterval(() => {
    client.user.setActivity(`${client.guilds.cache.size}`)
  }, 30000)

  // update member coins
  setInterval(async () => {
    for (const guildId in updatedMemberCoins) {
      await database
        .ref(`/coins/${guildId}`)
        .update(updatedMemberCoins[guildId]!)
      delete updatedMemberCoins[guildId]
    }
  }, 60000)
}

export default handleReady
