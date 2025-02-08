import { ChannelType, Client } from 'discord.js'
import { registerCommands } from './handleInteraction'
import {
  botData,
  channels,
  database,
  guildConfigs,
  updatedMemberCoins,
} from './utils/cache'
import timeFormatter from './utils/timeFormatter'

const handleReady = async (client: Client<true>) => {
  const loggerChannel = client.channels.cache.get(
    process.env['LOGGER_CHANNEL_ID'] || '',
  )
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
  setInterval(() => {
    client.user.setActivity(`on ${client.guilds.cache.size} guilds.`)
  }, 30000)

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
