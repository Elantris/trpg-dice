import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js'
import {
  channels,
  database,
  type ApplicationCommandProps,
} from '../utils/cache'

const data: ApplicationCommandProps['data'] = [
  new SlashCommandBuilder()
    .setName('trace')
    .setDescription('查看一則指令結果的詳細資訊')
    .addStringOption((option) =>
      option.setName('target').setDescription('訊息連結').setRequired(true),
    ),
  new ContextMenuCommandBuilder()
    .setName('trace')
    .setType(ApplicationCommandType.Message),
]

const execute: ApplicationCommandProps['execute'] = async (interaction) => {
  const options: {
    search: string
    targetMessageId: string
  } = {
    search: '',
    targetMessageId: '',
  }

  if (interaction.isChatInputCommand()) {
    options.search = interaction.options.getString('target', true)
  } else if (interaction.isMessageContextMenuCommand()) {
    options.search = interaction.targetMessage.url
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
    await interaction.reply({
      content: ':x: 未知的訊息格式',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const log: string =
    (
      await database
        .ref(`/logs/${interaction.guildId}/${options.targetMessageId}`)
        .once('value')
    ).val() ?? ''

  const [logMessageId, commandName] = log.split(',')
  if (!logMessageId) {
    await interaction.reply({
      content: `:x: \`${options.targetMessageId}\` 沒有擲骰紀錄`,
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const logMessage = commandName
    ? await channels['logger'].threads.cache
        .find((v) => v.name === commandName)
        ?.messages.fetch(logMessageId)
        .catch(() => null)
    : await channels['logger'].messages.fetch(logMessageId).catch(() => null)
  if (!logMessage) {
    await interaction.reply({
      content: `:question: \`${logMessageId}\` 可能因歷史悠久而紀錄遺失了`,
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  await interaction.reply({
    content: `:mag_right: \`${options.targetMessageId}\``,
    embeds: logMessage.embeds,
  })
}

export default {
  data,
  execute,
}
