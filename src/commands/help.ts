import { SlashCommandBuilder } from 'discord.js'
import { ApplicationCommandProps } from '../utils/cache'

const data: ApplicationCommandProps['data'] = [
  new SlashCommandBuilder().setName('help').setDescription('查看說明文件與開發群組連結').setDMPermission(false),
]

const execute: ApplicationCommandProps['execute'] = async (request) => {
  if (!request.isChatInputCommand()) {
    return
  }

  await request.reply(
    ':game_die: eeDice 擲骰機器人\n說明文件：<https://hackmd.io/@eelayntris/eedice>\n開發群組：https://discord.gg/Ctwz4BB',
  )
}

export default {
  data,
  execute,
}
