import {
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  Interaction,
  InteractionCallbackResponse,
  MessageComponentInteraction,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  TextChannel,
} from 'discord.js'
import admin from 'firebase-admin'
import appConfig from '../appConfig.js'
import coinFlipping from '../game/coinFlipping.js'
import diceOddEven from '../game/diceOddEven.js'
import handGame from '../game/handGame.js'
import roulette from '../game/roulette.js'
import slotMachine from '../game/slotMachine.js'
import randInt from './randInt.js'

// discord
export const channels: {
  [key in string]: TextChannel
} = {}

export type ApplicationCommandProps = {
  data: (
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | ContextMenuCommandBuilder
  )[]
  execute: (
    interaction: Interaction,
    overrideOptions?: Record<string, any>,
  ) => Promise<void>
}

// Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'trpg-dice-19e3e',
    clientEmail:
      'firebase-adminsdk-kf7kg@trpg-dice-19e3e.iam.gserviceaccount.com',
    privateKey: appConfig.PRIVATE_KEY,
  }),
  databaseURL: 'https://trpg-dice-19e3e-default-rtdb.firebaseio.com',
})

export const database = admin.database()

// command roll
export type RollResult = {
  value: number
  rolls: number[]
}

export const DICE_REGEXP = /\d*d\d+([a-z]+\d*){0,2}/gi // XdY, XdYaZbW

export const EXPRESSION_REGEXP = new RegExp(
  `^([+\\-*/,]?(\\d+(\\.\\d+)?|${DICE_REGEXP.source}))*$`,
  'gi',
) // [+-*/,] [X.Y | XdYaZbW]

export const ERROR_DESCRIPTIONS: Record<string, string> = {
  INVALID_TIMES: '算式重複計算次數限 1 ~ 10 次',
  INVALID_EXPRESSION: '無效的算式',
  INVALID_EXPRESSION_LENGTH: '算式長度限 50 字元',
  INVALID_DICE_EXPRESSIONS_NUMBER: '算式中的骰子語法限 1 ~ 10 個',
  INVALID_COUNT: '一個骰子語法中骰子數量限 1 ~ 20 顆',
  INVALID_SIDES: '骰子面數限 d1 ~ d100',
  INVALID_DICE_EXPRESSION: '骰子語法錯誤',
}

// command luck
export const guildLucks: {
  [GuildID in string]?: {
    [Date in string]?: {
      [UserID in string]?: string
    }
  }
} = {}

// command game
export const GameConfigNames = {
  MessageRewards: '文字訊息獎勵',
  VoiceRewards: '接聽語音獎勵',
}

export const GameNames = {
  coinFlipping: '硬幣猜正反',
  diceOddEven: '骰子猜單雙',
  slotMachine: '拉霸機',
  roulette: '幸運輪盤',
  handGame: '猜拳',
}

export type GameProps = {
  create: (
    interaction: ChatInputCommandInteraction,
  ) => Promise<InteractionCallbackResponse>
  execute: (interaction: MessageComponentInteraction) => Promise<{
    content: string
    luck: number | string
    result: string
    betCoins: number
    rewardCoins: number
  } | void>
}

export const Games: {
  [key in keyof typeof GameNames]: GameProps
} = {
  coinFlipping,
  diceOddEven,
  slotMachine,
  roulette,
  handGame,
}

export const statusKeys = ['version', 'guilds'] as const

export const botData: {
  readyAt: number
  message: {
    [GuildID in string]?: {
      [MemberID in string]?: number
    }
  }
  voice: {
    [GuildID in string]?: {
      [MemberID in string]?: number
    }
  }
} = {
  readyAt: Date.now(),
  message: {},
  voice: {},
}

export const guildConfigs: {
  [GuildID in string]?: {
    [key in keyof typeof GameConfigNames]?: {
      min: number
      max: number
    }
  }
} = {}

export const guildMemberCoins: {
  [GuildID in string]: {
    [MemberID in string]: number
  }
} = {}

export const updatedMemberCoins: {
  [GuildID in string]?: {
    [MemberID in string]?: number
  }
} = {}

export const getMemberCoins = async (
  guildId: string,
  memberId: string,
  now = Date.now(),
) => {
  if (!guildMemberCoins[guildId]) {
    guildMemberCoins[guildId] =
      (await database.ref(`/coins/${guildId}`).once('value')).val() || {}
  }

  if (typeof guildMemberCoins[guildId][memberId] === 'undefined') {
    guildMemberCoins[guildId][memberId] = 0
  }

  if (
    botData.voice[guildId]?.[memberId] &&
    guildConfigs[guildId]?.VoiceRewards
  ) {
    const minutes = Math.floor((now - botData.voice[guildId][memberId]) / 60000)
    if (minutes) {
      botData.voice[guildId][memberId] += minutes * 60000
      const { min, max } = guildConfigs[guildId].VoiceRewards
      const rewards = Array.from({ length: minutes }, () => randInt(min, max))
      setMemberCoins(
        guildId,
        memberId,
        guildMemberCoins[guildId][memberId] +
          rewards.reduce((a, b) => a + b, 0),
      )
    }
  }

  return guildMemberCoins[guildId][memberId] || 0
}

export const setMemberCoins = (
  guildId: string,
  memberId: string,
  coins: number,
) => {
  if (!guildMemberCoins[guildId]) {
    guildMemberCoins[guildId] = {}
  }
  guildMemberCoins[guildId][memberId] = coins

  if (!updatedMemberCoins[guildId]) {
    updatedMemberCoins[guildId] = {}
  }
  updatedMemberCoins[guildId][memberId] = coins
}
