import { Message, OmitPartialGroupDMChannel } from 'discord.js'
import {
  botData,
  getMemberCoins,
  guildConfigs,
  setMemberCoins,
} from './utils/cache.js'
import randInt from './utils/randInt.js'

const handleMessage = async (
  message: OmitPartialGroupDMChannel<Message<boolean>>,
) => {
  if (message.author.bot) {
    return
  }

  const guildId = message.guildId
  const userId = message.author.id

  if (
    !guildId ||
    !guildConfigs[guildId]?.MessageRewards ||
    message.createdTimestamp - (botData.message[guildId]?.[userId] ?? 0) < 10000
  ) {
    return
  }

  const memberCoins = await getMemberCoins(
    guildId,
    userId,
    message.createdTimestamp,
  )
  setMemberCoins(
    guildId,
    userId,
    memberCoins +
      randInt(
        guildConfigs[guildId].MessageRewards.min,
        guildConfigs[guildId].MessageRewards.max,
      ),
  )

  botData.message[guildId] ??= {}
  botData.message[guildId][userId] = message.createdTimestamp
}

export default handleMessage
