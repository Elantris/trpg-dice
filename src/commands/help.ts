import { SlashCommandBuilder } from 'discord.js'
import { type ApplicationCommandProps } from '../utils/cache'

const data: ApplicationCommandProps['data'] = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('查看說明文件與開發群組連結'),
]
const content = `
:game_die: eeDice 擲骰機器人
說明文件：<https://hackmd.io/@eelayntris/eedice>
開發群組：https://discord.gg/Ctwz4BB
`.trim()

const execute: ApplicationCommandProps['execute'] = async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return
  }

  await interaction.reply(content)
}

export default {
  data,
  execute,
}
