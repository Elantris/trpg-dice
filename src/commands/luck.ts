import { Message } from 'discord.js'
import { database } from '../utils/cache'
import timeFormatter from '../utils/timeFormatter'

const luckyNumbers: { [Date in string]?: number } = {}

const luck: (message: Message) => Promise<void> = async message => {
  const todayDate = timeFormatter({ format: 'yyyy-MM-dd' })
  if (!luckyNumbers[todayDate]) {
    const luckyNumber = (await database.ref(`/luckyNumbers/${todayDate}`).once('value')).val()
    luckyNumbers[todayDate] = luckyNumber || Math.floor(Math.random() * 100) + 1
    await database.ref(`/luckyNumbers/${todayDate}`).set(luckyNumbers[todayDate])
  }
  await message.channel.send(`:game_die: \`${todayDate}\` 今天的幸運數字是 **${luckyNumbers[todayDate]}**`)
}

export default luck
