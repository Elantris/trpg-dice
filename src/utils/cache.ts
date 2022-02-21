import { TextChannel } from 'discord.js'
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

export type RollResult = {
  value: number
  rolls: number[]
}
