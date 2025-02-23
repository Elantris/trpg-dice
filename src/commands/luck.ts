import { MessageFlags, SlashCommandBuilder } from 'discord.js'
import { DateTime } from 'luxon'
import OpenColor from 'open-color'
import {
  database,
  guildLucks,
  type ApplicationCommandProps,
} from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'
import randInt from '../utils/randInt'
import sendLog from '../utils/sendLog'

type PoolProps = {
  id: string
  sort: number
  name: string
  guildIds?: string[]
  items: {
    weight: number
    text: string
  }[]
}

const pools: PoolProps[] = [
  {
    id: 'default',
    sort: 0,
    name: '7 段運勢',
    items: [
      { weight: 100, text: ':nauseated_face: 大凶' },
      { weight: 100, text: ':green_circle: 凶' },
      { weight: 100, text: ':red_circle: 末吉' },
      { weight: 100, text: ':red_circle: 小吉' },
      { weight: 100, text: ':red_circle: 中吉' },
      { weight: 100, text: ':tada: 吉' },
      { weight: 100, text: ':confetti_ball: 大吉' },
    ],
  },
  {
    id: 'twelve',
    sort: 1,
    name: '12 段運勢',
    items: [
      { weight: 100, text: ':nauseated_face: 大凶' },
      { weight: 100, text: ':face_vomiting: 末凶' },
      { weight: 100, text: ':green_circle: 半凶' },
      { weight: 100, text: ':green_circle: 小凶' },
      { weight: 100, text: ':green_circle: 凶' },
      { weight: 100, text: ':red_circle: 末小吉' },
      { weight: 100, text: ':red_circle: 末吉' },
      { weight: 100, text: ':red_circle: 半吉' },
      { weight: 100, text: ':red_circle: 小吉' },
      { weight: 100, text: ':tada: 中吉' },
      { weight: 100, text: ':tada: 吉' },
      { weight: 100, text: ':confetti_ball: 大吉' },
    ],
  },
  {
    id: 'asakusa',
    sort: 2,
    name: '淺草籤運勢',
    items: [
      { weight: 30, text: ':green_circle: 凶' },
      { weight: 2, text: ':red_circle: 末小吉' },
      { weight: 6, text: ':red_circle: 末吉' },
      { weight: 5, text: ':red_circle: 小吉' },
      { weight: 5, text: ':red_circle: 半吉' },
      { weight: 35, text: ':tada: 吉' },
      { weight: 17, text: ':confetti_ball: 大吉' },
    ],
  },
]

const data: ApplicationCommandProps['data'] = [
  new SlashCommandBuilder()
    .setName('luck')
    .setDescription('今日運勢')
    .addSubcommand((command) =>
      command
        .setName('pick')
        .setDescription('抽選今日運勢')
        .addStringOption((option) =>
          option
            .setName('pool')
            .setDescription('運勢池')
            .setRequired(true)
            .addChoices(
              ...pools.map((pool) => ({ name: pool.name, value: pool.id })),
            ),
        ),
    )
    .addSubcommand((command) =>
      command
        .setName('guild')
        .setDescription('查看伺服器運勢')
        .addStringOption((option) =>
          option
            .setName('date')
            .setDescription(`日期 ${DateTime.now().toFormat('yyyy-MM-dd')}`),
        ),
    )
    .addSubcommand((command) =>
      command
        .setName('reset')
        .setDescription('重置伺服器運勢（限管理員）')
        .addStringOption((option) =>
          option
            .setName('date')
            .setDescription(`日期 ${DateTime.now().toFormat('yyyy-MM-dd')}`),
        ),
    ),
]

const execute: ApplicationCommandProps['execute'] = async (interaction) => {
  const options: {
    subcommand: string
    pool: string
    date: string
  } = {
    subcommand: 'pick',
    pool: 'default',
    date: '',
  }

  if (interaction.isChatInputCommand()) {
    const todayDate = DateTime.fromMillis(
      interaction.createdTimestamp,
    ).toFormat('yyyy-MM-dd')

    options.subcommand = interaction.options.getSubcommand()
    switch (options.subcommand) {
      case 'pick':
        options.pool = interaction.options.getString('pool') || 'default'

        if (!pools.find((pool) => pool.id === options.pool)) {
          await interaction.reply({
            content: `:x: 運勢池 \`${options.pool}\` 不存在`,
            flags: MessageFlags.Ephemeral,
          })
          return
        }

        options.date = todayDate
        break
      case 'guild':
      case 'reset':
        options.date = interaction.options.getString('date') || todayDate

        if (!DateTime.fromFormat(options.date, 'yyyy-MM-dd').isValid) {
          options.date = todayDate
        }
        break
      default:
        return
    }
  } else {
    return
  }

  if (!interaction.guild) {
    return
  }

  const guildId = interaction.guild.id
  const member = await interaction.guild.members.fetch(interaction.user.id)
  if (!member) {
    return
  }

  // handle reset lucks
  if (options.subcommand === 'reset') {
    if (
      member.id !== '156935214780776448' &&
      !member.permissions.has('Administrator')
    ) {
      await interaction.reply({
        content: `:lock: 你沒有權限使用此指令`,
        flags: MessageFlags.Ephemeral,
      })
      return
    }

    await database.ref(`/lucks/${guildId}/${options.date}`).remove()
    delete guildLucks[guildId]?.[options.date]
    const response = await interaction.reply({
      content: `:white_check_mark: 已重置 ${interaction.guild.name} \`${options.date}\` 的運勢`,
      withResponse: true,
    })
    const responseMessage = response.resource?.message
    await sendLog(responseMessage, interaction, {
      embed: {
        description: `
Message: [Link](${responseMessage?.url})
GuildId: \`${interaction.guild.id}\`
Command: reset
Date: ${options.date}
`.trim(),
      },
    })
    return
  }

  // init guild lucks
  if (!guildLucks[guildId]) {
    guildLucks[guildId] = {}
  }
  if (!guildLucks[guildId][options.date]) {
    guildLucks[guildId]![options.date] =
      (
        await database.ref(`/lucks/${guildId}/${options.date}`).once('value')
      ).val() || {}
  }

  // handle guild lucks
  if (options.subcommand === 'guild') {
    const userLucks: {
      userId: string
      time: number
      pool: string
      text: string
    }[] = Object.keys(guildLucks[guildId][options.date]!).map((userId) => {
      const [time, pool, text] =
        guildLucks[guildId]![options.date]![userId]!.split(';')
      return {
        userId,
        time: Number(time),
        pool,
        text,
      }
    })

    const response = await interaction.reply({
      embeds: [
        {
          color: colorFormatter(OpenColor.yellow[5]),
          title: `${interaction.guild.name} ${options.date} 總體運勢`,
          description: userLucks
            .sort((a, b) => a.time - b.time)
            .map(
              ({ userId, time, pool, text }) =>
                `\`${DateTime.fromMillis(time).toFormat('HH:mm:ss')}\` (${pool}) <@${userId}> ${text}`,
            )
            .join('\n'),
        },
      ],
      withResponse: true,
    })
    const responseMessage = response.resource?.message
    await sendLog(responseMessage, interaction, {
      embed: {
        description: `
Message: [Link](${responseMessage?.url})
GuildId: \`${interaction.guild.id}\`
Command: guild
Date: ${options.date}
`.trim(),
      },
    })
    return
  }

  // check exist
  if (guildLucks[guildId][options.date]![interaction.user.id]) {
    await interaction.reply({
      content: ':x: 你今天已經抽過運勢了，請明天再來',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  // random luck
  const pool = pools.find((pool) => pool.id === options.pool)!
  const totalWeights = pool.items.reduce((prev, item) => prev + item.weight, 0)
  const playerLuck = randInt(1, totalWeights)

  let tmpLuck = playerLuck
  let resultItem = pool.items[0]
  for (let i = 0; i !== pool.items.length; i++) {
    tmpLuck -= pool.items[i].weight
    if (tmpLuck <= 0) {
      resultItem = pool.items[i]
      break
    }
  }

  // save data
  const userData = `${interaction.createdTimestamp};${pool.name};${resultItem.text}`
  guildLucks[guildId][options.date]![interaction.user.id] = userData
  await database
    .ref(`/lucks/${guildId}/${options.date}/${interaction.user.id}`)
    .set(userData)

  // response
  const response = await interaction.reply({
    content: `:game_die: **${member.displayName}** 今日運勢（${pool.name}）：${resultItem.text}`,
    withResponse: true,
  })
  const responseMessage = response.resource?.message
  await sendLog(responseMessage, interaction, {
    embed: {
      description: `
Message: [Link](${responseMessage?.url})
Pool: ${options.pool}
Luck: ${playerLuck}/${totalWeights}
Result: ${resultItem.text} (${((resultItem.weight * 100) / totalWeights).toFixed(2)}%)
`.trim(),
    },
    isSave: !!responseMessage,
  })
}

export default {
  data,
  execute,
}
