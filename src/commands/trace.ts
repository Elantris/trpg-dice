import { Message } from 'discord.js'
import { channels, database } from '../utils/cache'

const trace: (message: Message) => Promise<void> = async message => {
  const search = message.content.split(':').slice(1).join(':').trim()

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
    message.channel.send(':x: syntax error')
    return
  }

  const logMessageId = (await database.ref(`/diceLogs/${targetMessageId}`).once('value')).val()
  if (!logMessageId) {
    await message.channel.send(':question: `MESSAGE_ID` is not a dice command'.replace('MESSAGE_ID', targetMessageId))
    return
  }

  const logMessage = await channels['logger']?.messages.fetch(logMessageId).catch(() => null)
  if (!logMessage) {
    await message.channel.send(':x: `MESSAGE_ID` is not found'.replace('MESSAGE_ID', logMessageId))
    return
  }

  await message.channel.send(':mag_right: `MESSAGE_ID`'.replace('MESSAGE_ID', targetMessageId), {
    embed: logMessage.embeds[0],
  })
}

export default trace
