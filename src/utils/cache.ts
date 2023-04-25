import { Interaction, Message, TextChannel } from 'discord.js'
import admin from 'firebase-admin'

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'trpg-dice-19e3e',
    clientEmail: 'firebase-adminsdk-kf7kg@trpg-dice-19e3e.iam.gserviceaccount.com',
    privateKey: process.env['PRIVATE_KEY'],
  }),
  databaseURL: 'https://trpg-dice-19e3e-default-rtdb.firebaseio.com',
})

export const database = admin.database()

export const channels: { [key in string]?: TextChannel } = {}

export type CommandProps = (request: Message<true> | Interaction) => Promise<void>
export type RollResult = {
  value: number
  rolls: number[]
}

export const DICE_REGEXP = /\d*d\d+([a-z]+\d*){0,2}/gi // XdY, XdYaZbW
export const EXPRESSION_REGEXP = new RegExp(`^([+\\-*/,]?(\\d+(\\.\\d+)?|${DICE_REGEXP.source}))*$`, 'gi')
export const ERROR_DESCRIPTIONS: Record<string, string> = {
  INVALID_REPEAT: '算式重複計算次數限 1 ~ 10 次',
  INVALID_EXPRESSION: '無效的算式',
  INVALID_EXPRESSION_LENGTH: '算式長度限 50 字元',
  INVALID_DICE_EXPRESSIONS_NUMBER: '算式中的骰子語法限 1 ~ 10 個',
  INVALID_TIMES: '同顆骰子重複次數限 1 ~ 20 次',
  INVALID_SIDES: '骰子面數限 d1 ~ d100',
  INVALID_DICE_EXPRESSION: '骰子語法錯誤',
}
