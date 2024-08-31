import { ChannelType, Client, SlashCommandBuilder } from 'discord.js'
import { DateTime } from 'luxon'
import OpenColor from 'open-color'
import randomInt from '../dice/randomInt'
import {
  ApplicationCommandProps,
  channels,
  database,
  lucks,
} from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'

const data: ApplicationCommandProps['data'] = [
  new SlashCommandBuilder()
    .setName('luck')
    .setDescription('今日運勢')
    .addSubcommand((command) =>
      command
        .setName('pick')
        .setDescription('抽選今日運勢')
        .addStringOption((option) =>
          option.setName('pool').setDescription('運勢池').setAutocomplete(true),
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
    )
    .setDMPermission(false),
]

type PoolProps = {
  name: string
  guildIds?: string[]
  items: {
    weight: number
    text: string
  }[]
}

const pools: {
  [poolId: string]: PoolProps
} = {
  default: {
    name: '通用',
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
  twelve: {
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
      { weight: 100, text: ':red_circle: 中吉' },
      { weight: 100, text: ':tada: 吉' },
      { weight: 100, text: ':confetti_ball: 大吉' },
    ],
  },
  asakusa: {
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
}

export const loadPool = async (client: Client<true>) => {
  const channel = client.channels.cache.get('1256444851042517013')
  if (channel?.type !== ChannelType.PublicThread) {
    console.error('Failed to load luck pool.')
    return
  }

  const messages = await channel.messages.fetch({
    limit: 100,
  })

  messages.forEach((message) => {
    const data = message.content.split('\n')
    /*
      id,name
      guildId,guildId
      weight,text
    */
    const [id, name] = data[0].split(',')
    const guildIds = data[1].split(',').filter((v) => v)
    const items = data.slice(2).map((v) => {
      const [weight, text] = v.split(',')
      return {
        weight: Number(weight),
        text: text,
      }
    })

    if (guildIds.length === 0) {
      return
    }

    const pool: PoolProps = {
      name,
      guildIds,
      items,
    }

    pools[id] = pool
  })
}

const cachedGuildPools: {
  [guildId: string]: {
    name: string
    value: string
  }[]
} = {}

const autocomplete: ApplicationCommandProps['autocomplete'] = async (
  interaction,
) => {
  if (!interaction.guildId) {
    !interaction.respond([])
    return
  }

  const subcommand = interaction.options.getSubcommand()

  if (subcommand === 'pick') {
    if (!cachedGuildPools[interaction.guildId]) {
      cachedGuildPools[interaction.guildId] = []

      for (const poolId in pools) {
        if (
          !pools[poolId].guildIds ||
          pools[poolId].guildIds.includes(interaction.guildId)
        ) {
          cachedGuildPools[interaction.guildId].push({
            name: pools[poolId].name,
            value: poolId,
          })
        }
      }
    }

    await interaction.respond(cachedGuildPools[interaction.guildId])
    return
  }
}

const execute: ApplicationCommandProps['execute'] = async (request) => {
  const options: {
    subcommand: 'pick' | 'guild' | 'reset'
    pool: string
    date: string
  } = {
    subcommand: 'pick',
    pool: 'default',
    date: '',
  }

  if (request.isChatInputCommand()) {
    const todayDate = DateTime.fromMillis(request.createdTimestamp).toFormat(
      'yyyy-MM-dd',
    )

    options.subcommand =
      request.options.getSubcommand() as typeof options.subcommand
    switch (options.subcommand) {
      case 'pick':
        options.pool = request.options.getString('pool') || 'default'

        if (!pools[options.pool]) {
          await request.reply({
            content: `:x: 運勢池 \`${options.pool}\` 不存在`,
            ephemeral: true,
          })
          return
        }

        options.date = todayDate
        break
      case 'guild':
      case 'reset':
        options.date = request.options.getString('date') || todayDate

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

  if (!request.guild) {
    return
  }

  const guildId = request.guild.id
  const member = await request.guild.members.fetch(request.user.id)
  if (!member) {
    return
  }

  // handle reset lucks
  if (options.subcommand === 'reset') {
    if (
      member.id !== '156935214780776448' &&
      !member.permissions.has('Administrator')
    ) {
      await request.reply({
        content: `:lock: 你沒有權限使用此指令`,
        ephemeral: true,
      })
      return
    }

    await database.ref(`/lucks/${guildId}/${options.date}`).remove()
    delete lucks[guildId]?.[options.date]
    const responseMessage = await request.reply({
      content: `:white_check_mark: 已重置 ${request.guild.name} \`${options.date}\` 的運勢`,
      fetchReply: true,
    })

    await channels['logger'].send({
      embeds: [
        {
          color: colorFormatter(OpenColor.yellow[5]),
          author: {
            icon_url: request.user.displayAvatarURL(),
            name: request.user.tag,
          },
          description: `Message: [Link](${responseMessage.url})\nGuildId: \`${request.guild.id}\`\nCommand: ${options.subcommand}\nDate: ${options.date}`,
          timestamp: request.createdAt.toISOString(),
          footer: {
            text: `${responseMessage.createdTimestamp - request.createdTimestamp}ms`,
          },
        },
      ],
    })

    return
  }

  // init guild lucks
  if (!lucks[guildId]) {
    lucks[guildId] = {}
  }
  if (!lucks[guildId][options.date]) {
    await database
      .ref(`/lucks/${guildId}/${options.date}`)
      .once('value', (snapshot) => {
        lucks[guildId][options.date] = snapshot.val()
      })
  }
  if (!lucks[guildId][options.date]) {
    delete lucks[guildId]
    lucks[guildId] = {
      [options.date]: {},
    }
  }

  // handle guild lucks
  if (options.subcommand === 'guild') {
    const userLucks: {
      userId: string
      time: number
      pool: string
      text: string
    }[] = Object.keys(lucks[guildId][options.date]).map((userId) => {
      const [time, pool, text] = lucks[guildId][options.date][userId].split(';')
      return {
        userId,
        time: Number(time),
        pool,
        text,
      }
    })

    const responseMessage = await request.reply({
      embeds: [
        {
          color: colorFormatter(OpenColor.yellow[5]),
          title: `${request.guild.name} ${options.date} 總體運勢`,
          description: `${userLucks
            .sort((a, b) => a.time - b.time)
            .map(
              ({ userId, time, pool, text }) =>
                `\`${DateTime.fromMillis(time).toFormat('HH:mm:ss')}\` (${pool}) <@${userId}> ${text}`,
            )
            .join('\n')}`,
        },
      ],
      fetchReply: true,
    })

    await channels['logger'].send({
      embeds: [
        {
          color: colorFormatter(OpenColor.yellow[5]),
          author: {
            icon_url: request.user.displayAvatarURL(),
            name: request.user.tag,
          },
          description: `Message: [Link](${responseMessage.url})\nGuildId: \`${request.guild.id}\`\nCommand: ${options.subcommand}\nDate: ${options.date}`,
          timestamp: request.createdAt.toISOString(),
          footer: {
            text: `${responseMessage.createdTimestamp - request.createdTimestamp}ms`,
          },
        },
      ],
    })

    return
  }

  // check exist
  if (
    process.env['NODE_ENV'] !== 'development' &&
    lucks[guildId][options.date][request.user.id]
  ) {
    await request.reply({
      content: ':x: 你今天已經抽過運勢了，請明天再來',
      ephemeral: true,
    })
    return
  }

  // random luck
  const pool = pools[options.pool]
  const totalWeights = pool.items.reduce((prev, item) => prev + item.weight, 0)
  const playerLuck = randomInt(1, totalWeights)

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
  const userData = `${request.createdTimestamp};${pool.name};${resultItem.text}`
  lucks[guildId][options.date][request.user.id] = userData
  await database
    .ref(`/lucks/${guildId}/${options.date}/${request.user.id}`)
    .set(userData)

  // response
  const responseMessage = await request.reply({
    content: `:game_die: **${member.displayName}** 今日運勢（${pools[options.pool].name}）：${resultItem.text}`,
    fetchReply: true,
  })
  const logMessage = await channels['logger'].send({
    embeds: [
      {
        color: colorFormatter(OpenColor.yellow[5]),
        author: {
          icon_url: request.user.displayAvatarURL(),
          name: request.user.tag,
        },
        description: `Message: [Link](${responseMessage.url})\nPool: ${options.pool}\nLuck: ${playerLuck}/${totalWeights}\nResult: ${resultItem.text} (${((resultItem.weight * 100) / totalWeights).toFixed(2)}%)`,
        timestamp: request.createdAt.toISOString(),
        footer: {
          text: `${responseMessage.createdTimestamp - request.createdTimestamp}ms`,
        },
      },
    ],
  })
  if (logMessage) {
    await database
      .ref(`/logs/${request.guildId}/${responseMessage.id}`)
      .set(logMessage.id)
  }
}

export default {
  data,
  execute,
  autocomplete,
}
