import { Message } from 'discord.js'

const help: (message: Message) => Promise<void> = async message => {
  await message.channel.send(
    ':game_die: eeDice 擲骰機器人\n說明文件：<https://hackmd.io/@eelayntris/eedice>\n開發群組：https://discord.gg/Ctwz4BB',
  )
}

export default help
