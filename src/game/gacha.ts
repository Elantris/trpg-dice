import OpenColor from 'open-color'
import { GameNames, GameProps } from '../utils/cache.js'
import colorFormatter from '../utils/colorFormatter.js'

const create: GameProps['create'] = async (interaction) => {
  const gameBet = interaction.options.getInteger('bet', true)

  return await interaction.reply({
    content: `:coin: ${GameNames.gacha}，每次下注 :coin: ${gameBet}`,
    embeds: [
      {
        color: colorFormatter(OpenColor.orange[5]),
        title: '遊戲規則',
        description: 'eeDice 提供抽卡的',
      },
    ],
    withResponse: true,
  })
}

const execute: GameProps['execute'] = (interaction) => {}

const gacha = {
  create,
  execute,
}

export default gacha
