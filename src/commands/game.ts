import {
  AnySelectMenuInteraction,
  ButtonInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  InteractionCallbackResponse,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  User,
} from 'discord.js'
import { DateTime } from 'luxon'
import OpenColor from 'open-color' with { type: 'json' }
import {
  ApplicationCommandProps,
  database,
  GameConfigNames,
  GameNames,
  Games,
  getMemberCoins,
  guildConfigs,
  guildMemberCoins,
  setMemberCoins,
} from '../utils/cache.js'
import colorFormatter from '../utils/colorFormatter.js'
import isKeyOfObject from '../utils/isKeyOfObject.js'
import sendLog from '../utils/sendLog.js'

const data: ApplicationCommandProps['data'] = [
  new SlashCommandBuilder()
    .setName('game')
    .setDescription('遊戲')
    .addSubcommand((command) =>
      command
        .setName('config')
        .setDescription('設定遊戲參數（限管理員）')
        .addStringOption((option) =>
          option
            .setName('key')
            .setDescription('參數名稱')
            .setRequired(true)
            .addChoices(
              ...Object.keys(GameConfigNames).map((key) => ({
                name: GameConfigNames[key as keyof typeof GameConfigNames],
                value: key,
              })),
            ),
        )
        .addIntegerOption((option) =>
          option
            .setName('min')
            .setDescription('參數最小值 1 ~ 10000，超出範圍代表刪除')
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName('max')
            .setDescription('參數最大值 1 ~ 10000，超出範圍代表刪除')
            .setRequired(true),
        ),
    )
    .addSubcommand((command) =>
      command
        .setName('coins')
        .setDescription('調整成員的點數數量（限管理員）')
        .addUserOption((option) =>
          option.setName('member').setDescription('指定成員').setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName('amount')
            .setDescription('調整數量，-100000 ~ 100000')
            .setRequired(true),
        ),
    )
    .addSubcommand((command) =>
      command
        .setName('rank')
        .setDescription('查看伺服器成員點數排行榜（限管理員）'),
    )
    .addSubcommand((command) =>
      command
        .setName('create')
        .setDescription('建立遊戲（限管理員）')
        .addStringOption((option) =>
          option
            .setName('name')
            .setDescription('遊戲名稱')
            .setRequired(true)
            .addChoices(
              ...Object.keys(GameNames).map((key) => ({
                name: GameNames[key as keyof typeof GameNames],
                value: key,
              })),
            ),
        )
        .addIntegerOption((option) =>
          option.setName('bet').setDescription('下注點數').setRequired(true),
        ),
    ),
]

const execute: ApplicationCommandProps['execute'] = async (interaction) => {
  if (interaction.isMessageComponent()) {
    await handleMessageComponent(interaction)
  } else if (interaction.isChatInputCommand()) {
    await handleChatInputCommand(interaction)
  }
}

const handleMessageComponent = async (
  interaction: AnySelectMenuInteraction | ButtonInteraction,
) => {
  if (!interaction.guildId) {
    return
  }
  const guildId = interaction.guildId
  const memberId = interaction.user.id

  const [commandName, gameName, gameBet, action] =
    interaction.customId.split('_')
  if (commandName !== 'game') {
    return
  }

  if (!isKeyOfObject(gameName, GameNames)) {
    await interaction.reply({
      content: ':x: 遊戲不存在',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  if (action === 'check') {
    const memberCoins = await getMemberCoins(
      guildId,
      memberId,
      interaction.createdTimestamp,
    )
    await interaction.reply({
      content: `:dart: 你目前擁有 :coin: ${memberCoins}`,
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  if (action === 'end') {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      await interaction.reply({
        content: ':lock: 只有管理員可以結束遊戲',
        flags: MessageFlags.Ephemeral,
      })
      return
    }
    const content = `:dart: <@!${memberId}> 結束了遊戲 <t:${DateTime.fromMillis(interaction.createdTimestamp).toFormat('X')}:R>`
    await interaction.message.edit({
      content: `${interaction.message.content}\n${content}`,
      embeds: interaction.message.embeds,
      components: [],
      allowedMentions: { parse: [] },
    })
    await interaction.reply({
      content,
      allowedMentions: { parse: [] },
      flags: MessageFlags.Ephemeral,
    })
    await sendLog(null, interaction, {
      embed: {
        description: `
Interaction: \`${interaction.customId}\`
Guild: \`${guildId}\`
Response: ${content}
`.trim(),
      },
    })
    return
  }

  let thread = interaction.message.thread
  if (thread?.type !== ChannelType.PublicThread || thread.locked) {
    await interaction.reply({
      content: `:x: 討論串不存在`,
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const memberCoins = await getMemberCoins(
    guildId,
    memberId,
    interaction.createdTimestamp,
  )
  const betCoins = Number(gameBet)

  if (memberCoins < betCoins) {
    await interaction.reply({
      content: `:x: 參加遊戲需要 :coin: ${betCoins}，你目前擁有 :coin: ${memberCoins}`,
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const result = await Games[gameName].execute(interaction)
  if (result) {
    const newMemberCoins = memberCoins - result.betCoins + result.rewardCoins
    if (memberCoins !== newMemberCoins) {
      setMemberCoins(guildId, memberId, newMemberCoins)
    }

    const threadMessage = await thread.send({
      content: result.content,
      allowedMentions: { parse: [] },
    })
    await sendLog(threadMessage, interaction, {
      embed: {
        description: `
Interaction: \`${interaction.customId}\`
${
  interaction.isAnySelectMenu()
    ? `Values: \`${JSON.stringify(interaction.values)}\``
    : ''
}
Guild: \`${guildId}\`
Luck: \`${result.luck}\` ${result.result}
Coins: ${memberCoins} - ${result.betCoins} + ${result.rewardCoins} = ${newMemberCoins}
`.trim(),
      },
    })
  }
}

const handleChatInputCommand = async (
  interaction: ChatInputCommandInteraction,
) => {
  if (!interaction.guild) {
    return
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: ':lock: 只有管理員可以使用這個指令',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const options: {
    key?: string
    min?: number
    max?: number
    member?: User
    amount?: number
    name?: string
    bet?: number
  } = {}
  const guildId = interaction.guild.id
  let response: InteractionCallbackResponse | null = null

  switch (interaction.options.getSubcommand()) {
    case 'config':
      options.key = interaction.options.getString('key', true)
      ;[options.min, options.max] = [
        interaction.options.getInteger('min', true),
        interaction.options.getInteger('max', true),
      ].sort((a, b) => a - b)

      if (!isKeyOfObject(options.key, GameConfigNames)) {
        await interaction.reply({
          content: ':x: 遊戲參數不存在',
          flags: MessageFlags.Ephemeral,
        })
        return
      }

      if (options.min < 1 || options.max > 10000) {
        delete guildConfigs[guildId]?.[options.key]
        await database.ref(`/configs/${guildId}/${options.key}`).remove()
        response = await interaction.reply({
          content: `:gear: 移除 ${GameConfigNames[options.key]}`,
          withResponse: true,
        })
        break
      }

      if (!guildConfigs[guildId]) {
        guildConfigs[guildId] = {}
      }
      if (!guildConfigs[guildId][options.key]) {
        guildConfigs[guildId][options.key] = {
          min: 0,
          max: 0,
        }
      }
      guildConfigs[guildId][options.key]!.min = options.min
      guildConfigs[guildId][options.key]!.max = options.max
      await database
        .ref(`/configs/${guildId}/${options.key}`)
        .set({ min: options.min, max: options.max })

      response = await interaction.reply({
        content: `:gear: 設定 ${GameConfigNames[options.key]} 為 ${options.min} ~ ${options.max}`,
        withResponse: true,
      })
      break

    case 'coins':
      options.member = interaction.options.getUser('member', true)
      options.amount = interaction.options.getInteger('amount', true)
      if (
        options.amount === 0 ||
        options.amount < -100000 ||
        options.amount > 100000
      ) {
        await interaction.reply({
          content: ':x: 調整數量必須在 -100000 ~ 100000 之間，且不得為 0',
          flags: MessageFlags.Ephemeral,
        })
        return
      }

      const memberCoins = await getMemberCoins(guildId, options.member.id)
      const newMemberCoins = memberCoins + options.amount
      setMemberCoins(guildId, options.member.id, newMemberCoins)
      response = await interaction.reply({
        content: `:dart: <@!${options.member.id}> ${options.amount > 0 ? '增加' : '減少'} :coin: ${options.amount}，現在擁有 :coin: ${newMemberCoins}`,
        allowedMentions: { parse: [] },
        withResponse: true,
      })
      break

    case 'rank':
      if (!guildMemberCoins[guildId]) {
        guildMemberCoins[guildId] =
          (await database.ref(`/coins/${guildId}`).once('value')).val() || {}
      }

      response = await interaction.reply({
        content: `:dart: ${interaction.guild.name} 排行`,
        embeds: [
          {
            color: colorFormatter(OpenColor.orange[5]),
            description: Object.keys(guildMemberCoins[guildId])
              .sort(
                (a, b) =>
                  guildMemberCoins[guildId]![b]! -
                  guildMemberCoins[guildId]![a]!,
              )
              .slice(0, 10)
              .map((userId, index) =>
                `${index + 1}. <@!${userId}> :coin: ${guildMemberCoins[guildId]?.[userId] || 0} ${interaction.guild?.members.cache.get(userId)?.permissions?.has(PermissionFlagsBits.Administrator) ? '(Admin)' : ''}`.trim(),
              )
              .join('\n'),
          },
        ],
        withResponse: true,
      })
      break

    case 'create':
      options.name = interaction.options.getString('name', true)
      options.bet = interaction.options.getInteger('bet', true)
      if (!isKeyOfObject(options.name, GameNames)) {
        await interaction.reply({
          content: ':x: 遊戲不存在',
          flags: MessageFlags.Ephemeral,
        })
        return
      }
      if (options.bet < 1 || options.bet > 10000) {
        await interaction.reply({
          content: ':x: 下注數量必須在 1 ~ 10000 之間',
          flags: MessageFlags.Ephemeral,
        })
        return
      }

      const channel = interaction.channel
      if (channel?.type !== ChannelType.GuildText) {
        await interaction.reply({
          content: ':x: 建立遊戲必須在一般文字頻道',
          flags: MessageFlags.Ephemeral,
        })
        return
      }

      if (
        !channel
          ?.permissionsFor(interaction.client.user)
          ?.has(PermissionFlagsBits.CreatePublicThreads) ||
        !channel
          ?.permissionsFor(interaction.client.user)
          ?.has(PermissionFlagsBits.SendMessagesInThreads)
      ) {
        await interaction.reply({
          content: `:x: eeDice 在 <#${channel.id}> 需要權限：「建立公開討論串」、「在討論串中傳送訊息」`,
          flags: MessageFlags.Ephemeral,
        })
        return
      }

      response = await Games[options.name].create(interaction)
      await response.resource?.message?.startThread({
        name: `${GameNames[options.name]} (${options.bet})`,
      })
      break

    default:
      return
  }

  const responseMessage = response?.resource?.message
  await sendLog(responseMessage, interaction, {
    embed: {
      description: `
Guild: ${interaction.guild.name} \`${guildId}\`
Subcommand: ${interaction.options.getSubcommand()}
Options: ${Object.keys(options)
        .map((key) => `\`${key}:${options[key as keyof typeof options]}\``)
        .join(' ')}
Response: ${responseMessage?.content}
`.trim(),
    },
  })
}

export default {
  data,
  execute,
}
