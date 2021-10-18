import { TextChannel } from 'discord.js'
import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../../serviceAccountKey.json'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  databaseURL: 'https://power87-12b03.firebaseio.com',
})

export const database = admin.database()

export const channels: { [key in string]?: TextChannel } = {}

export type RollResult = {
  total: number
  rolls: number[]
}
