import { ApplicationCommandType, ContextMenuCommandBuilder, SlashCommandBuilder } from 'discord.js'
import { CommandProps, channels, database } from '../utils/cache'

const data = [
  new SlashCommandBuilder()
    .setName('trace')
    .setDescription('查看一則指令結果的詳細資訊')
    .addStringOption(option => option.setName('target').setDescription('訊息的連結或 ID').setRequired(true)),
  new ContextMenuCommandBuilder().setName('trace').setType(ApplicationCommandType.Message),
]

const execute: CommandProps = async request => {
  const options: {
    search: string
    targetMessageId: string
  } = {
    search: '',
    targetMessageId: '',
  }

  if (request.isChatInputCommand()) {
    options.search = request.options.getString('target', true)
  } else if (request.isMessageContextMenuCommand()) {
    options.search = request.targetMessage.url
  } else {
    return
  }

  if (/^https:\/\/\S*\/channels\/\d+\/\d+\/\d+$/.test(options.search)) {
    // full message link
    const [messageId] = options.search.split('/').slice(-1)
    options.targetMessageId = messageId
  } else if (/^\d+\-\d+$/.test(options.search)) {
    // channel id - message id
    const [, messageId] = options.search.split('-')
    options.targetMessageId = messageId
  } else if (/^\d+$/.test(options.search)) {
    // message id
    options.targetMessageId = options.search
  } else {
    await request.reply({
      content: ':x: 找不到訊息',
      ephemeral: true,
    })
    return
  }

  const logMessageId = (await database.ref(`/logs/${request.guildId}/${options.targetMessageId}`).once('value')).val()
  if (!logMessageId) {
    await request.reply({
      content: `:x: \`${options.targetMessageId}\` 沒有擲骰紀錄`,
      ephemeral: true,
    })
    return
  }

  const logMessage = await channels['logger']?.messages.fetch(logMessageId).catch(() => null)
  if (!logMessage) {
    await request.reply({
      content: `:question: \`${logMessageId}\` 可能因歷史悠久而紀錄遺失了`,
      ephemeral: true,
    })
    return
  }

  await request.reply({
    content: `:mag_right: \`${options.targetMessageId}\``,
    embeds: logMessage.embeds,
  })
}

export default {
  data,
  execute,
}
