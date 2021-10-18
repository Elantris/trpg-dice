import { TextChannel } from 'discord.js'
import admin, { ServiceAccount } from 'firebase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

const serviceAccount: ServiceAccount = JSON.parse(
  readFileSync(join(__dirname, '../../serviceAccountKey.json'), { encoding: 'utf8' }),
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://power87-12b03.firebaseio.com',
})

export const database = admin.database()

export const channels: { [key in string]?: TextChannel } = {}

export type RollResult = {
  total: number
  rolls: number[]
}
