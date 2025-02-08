import {
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
import OpenColor from 'open-color'
import {
  channels,
  database,
  GameConfigNames,
  GameNames,
  Games,
  getMemberCoins,
  guildConfigs,
  guildMemberCoins,
  setMemberCoins,
  type ApplicationCommandProps,
} from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'
import isKeyOfObject from '../utils/isKeyOfObject'

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
        .setDescription('調整成員的硬幣數量（限管理員）')
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
      command.setName('rank').setDescription('硬幣排行榜（限管理員）'),
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
          option.setName('bet').setDescription('下注數量').setRequired(true),
        ),
    ),
]

const execute: ApplicationCommandProps['execute'] = async (interaction) => {
  if (interaction.isButton()) {
    await handleButton(interaction)
  } else if (interaction.isChatInputCommand()) {
    await handleChatInputCommand(interaction)
  }
}

const handleButton = async (interaction: ButtonInteraction) => {
  if (!interaction.guildId) {
    return
  }

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
    const content = `:dart: <@!${interaction.user.id}> 結束了遊戲 <t:${DateTime.fromMillis(interaction.createdTimestamp).toFormat('X')}:R>`
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
    return
  }

  let thread = interaction.message.thread
  if (thread?.type !== ChannelType.PublicThread) {
    return
  }

  const guildId = interaction.guildId
  const memberId = interaction.user.id
  const memberCoins = await getMemberCoins(
    guildId,
    memberId,
    interaction.createdTimestamp,
  )
  const betCoins = Number(gameBet)

  if (memberCoins < betCoins) {
    await interaction.reply({
      content: `:x: 參加遊戲需要 :coin: ${gameBet}，你目前擁有 :coin: ${memberCoins}`,
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const result = await Games[gameName].execute(interaction)
  if (result) {
    if (betCoins !== result.rewardCoins) {
      setMemberCoins(
        guildId,
        memberId,
        memberCoins - betCoins + result.rewardCoins,
      )
    }

    const threadMessage = await thread.send({
      content: result.content,
      allowedMentions: { parse: [] },
    })
    await channels['logger'].send({
      embeds: [
        {
          color: colorFormatter(OpenColor.orange[5]),
          author: {
            icon_url: interaction.user.displayAvatarURL(),
            name: interaction.user.tag,
          },
          description: `
Message: [Link](${threadMessage.url}) \`${interaction.customId}\`
Luck: \`${result.luck}\` ${result.result}
Rewards: ${result.rewardCoins}
`.trim(),
          timestamp: interaction.createdAt.toISOString(),
          footer: {
            text: `${threadMessage.createdTimestamp - interaction.createdTimestamp}ms`,
          },
        },
      ],
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
      const [configMin, configMax] = [
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

      if (configMin < 1 || configMax > 10000) {
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
      guildConfigs[guildId][options.key]!.min = configMin
      guildConfigs[guildId][options.key]!.max = configMax
      await database
        .ref(`/configs/${guildId}/${options.key}`)
        .set({ min: configMin, max: configMax })

      response = await interaction.reply({
        content: `:gear: 設定 ${GameConfigNames[options.key]} 為 ${configMin} ~ ${configMax}`,
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
      guildMemberCoins[guildId] = Object.assign(
        {},
        (await database.ref(`/coins/${guildId}`).once('value')).val() || {},
        guildMemberCoins[guildId] || {},
      )

      response = await interaction.reply({
        content: `:dart: ${interaction.guild.name} 排行`,
        embeds: [
          {
            color: colorFormatter(OpenColor.orange[5]),
            description: Object.keys(guildMemberCoins[guildId]!)
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
  if (responseMessage) {
    const logMessage = await channels['logger'].send({
      embeds: [
        {
          color: colorFormatter(OpenColor.orange[5]),
          author: {
            icon_url: interaction.user.displayAvatarURL(),
            name: interaction.user.tag,
          },
          description: `
Message: [Link](${responseMessage.url})
Subcommand: ${interaction.options.getSubcommand()}
Options: ${Object.keys(options)
            .map((key) => `\`${key}:${options[key as keyof typeof options]}\``)
            .join(' ')}
Result: ${responseMessage.content}
`.trim(),
          timestamp: interaction.createdAt.toISOString(),
          footer: {
            text: `${responseMessage.createdTimestamp - interaction.createdTimestamp}ms`,
          },
        },
      ],
    })
    await database
      .ref(`/logs/${guildId}/${responseMessage.id}`)
      .set(logMessage.id)
  }
}

export default {
  data: process.env['NODE_ENV'] === 'development' ? data : undefined,
  execute,
}
