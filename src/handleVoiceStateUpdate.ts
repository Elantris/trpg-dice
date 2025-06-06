import { VoiceState } from 'discord.js'
import { botData, getMemberCoins, guildConfigs } from './utils/cache.js'

const handleVoiceStateUpdate = async (
  oldState: VoiceState,
  newState: VoiceState,
) => {
  if (newState.member?.user.bot) {
    return
  }

  const now = Date.now()
  const guildId = newState.guild.id
  const memberId = newState.member?.id

  if (!memberId || !guildConfigs[guildId]?.VoiceRewards) {
    return
  }

  if (oldState.channelId && !newState.channelId) {
    botData.voice[guildId] ??= {}
    botData.voice[guildId][memberId] ??= botData.readyAt
    await getMemberCoins(guildId, memberId, now)
    delete botData.voice[guildId][memberId]
    return
  }

  if (!oldState.channelId && newState.channelId) {
    botData.voice[guildId] ??= {}
    botData.voice[guildId][memberId] = now
    return
  }
}

export default handleVoiceStateUpdate
