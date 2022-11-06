import { Message } from 'discord.js'
import randomInt from '../dice/randomInt'
import { database } from '../utils/cache'
import timeFormatter from '../utils/timeFormatter'

const luckyNumbers: { [Date in string]?: number } = {}

const template = `
:game_die: eeDice 擲骰機器人
今天 \`TODAY_DATE\` 的幸運數字是 **LUCKY_NUMBER**
說明文件：<https://hackmd.io/@eelayntris/eedice>
開發群組：https://discord.gg/Ctwz4BB
`.trim()

const luck: (message: Message<true>) => Promise<void> = async message => {
  const todayDate = timeFormatter({ format: 'yyyy-MM-dd' })
  if (!luckyNumbers[todayDate]) {
    const luckyNumber = (await database.ref(`/luckyNumbers/${todayDate}`).once('value')).val() || randomInt(1, 100)
    luckyNumbers[todayDate] = luckyNumber
    await database.ref(`/luckyNumbers/${todayDate}`).set(luckyNumber)
  }

  await message.channel.send(
    template.replace('TODAY_DATE', todayDate).replace('LUCKY_NUMBER', `${luckyNumbers[todayDate]}`),
  )
}

export default luck
