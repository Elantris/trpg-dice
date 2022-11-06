import { Message } from 'discord.js'
import { channels, database } from '../utils/cache'

const trace: (message: Message<true>) => Promise<void> = async message => {
  const search = message.reference?.messageId || message.content.replace(/^(trace|t):/i, '').trim()

  let targetMessageId = ''
  if (/^https:\/\/\S*\/channels\/\d+\/\d+\/\d+$/.test(search)) {
    // full message link
    const [messageId] = search.split('/').slice(-1)
    targetMessageId = messageId
  } else if (/^\d+\-\d+$/.test(search)) {
    // channel id - message id
    const [, messageId] = search.split('-')
    targetMessageId = messageId
  } else if (/^\d+$/.test(search)) {
    // message id
    targetMessageId = search
  } else {
    await message.channel.send(':x: syntax error')
    return
  }

  const logMessageId = (await database.ref(`/logs/${message.guildId}/${targetMessageId}`).once('value')).val()
  if (!logMessageId) {
    await message.channel.send(':x: `MESSAGE_ID` 沒有擲骰紀錄'.replace('MESSAGE_ID', targetMessageId))
    return
  }

  const logMessage = await channels['logger']?.messages.fetch(logMessageId).catch(() => null)
  if (!logMessage) {
    await message.channel.send(':question: `MESSAGE_ID` 記錄遺失了'.replace('MESSAGE_ID', logMessageId))
    return
  }

  await message.channel.send({
    content: ':mag_right: `MESSAGE_ID`'.replace('MESSAGE_ID', targetMessageId),
    embeds: logMessage.embeds,
  })
}

export default trace
