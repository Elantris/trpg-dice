import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js'
import OpenColor from 'open-color' with { type: 'json' }
import { GameNames, GameProps } from '../utils/cache.js'
import colorFormatter from '../utils/colorFormatter.js'
import randInt from '../utils/randInt.js'

const create: GameProps['create'] = async (interaction) => {
  const gameBet = interaction.options.getInteger('bet', true)

  return await interaction.reply({
    content: `:game_die: ${GameNames.diceOddEven}，每次下注 :coin: ${gameBet}`,
    embeds: [
      {
        color: colorFormatter(OpenColor.orange[5]),
        title: '遊戲規則',
        description:
          'eeDice 丟擲三顆骰子，玩家猜所有骰子點數總和為單(奇數)或雙(偶數)，猜中時獲得兩倍下注點數，當擲骰結果為三個 1 或三個 6 時玩家判輸。',
      },
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_diceOddEven_${gameBet}_odd`)
            .setLabel('單')
            .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_diceOddEven_${gameBet}_even`)
            .setLabel('雙')
            .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_diceOddEven_${gameBet}_check`)
            .setLabel('查看')
            .setStyle(ButtonStyle.Success),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_diceOddEven_${gameBet}_end`)
            .setLabel('結束')
            .setStyle(ButtonStyle.Danger),
        ),
    ],
    withResponse: true,
  })
}

const execute: GameProps['execute'] = async (interaction) => {
  const [, , gameBet, action] = interaction.customId.split('_')

  if (action !== 'odd' && action !== 'even') {
    await interaction.reply({
      content: ':x: 未知的動作',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const lucks: number[] = Array.from({ length: 3 }, () => randInt(1, 6))
  const sum = lucks.reduce((a, b) => a + b, 0)
  const result =
    sum === 3 || sum === 18 ? 'other' : sum % 2 === 0 ? 'even' : 'odd'
  const isWinning = action === result
  const betCoins = Number(gameBet)
  const rewardCoins = isWinning ? betCoins * 2 : 0

  const content = `:game_die: <@!${interaction.user.id}> 下注「${action === 'odd' ? '單' : '雙'}」，擲骰結果「${lucks.join('、')}」總和為「**${sum}**」${isWinning ? `，獲得 :coin: ${rewardCoins}` : ''}`

  return {
    content,
    luck: `${lucks}`,
    result,
    betCoins,
    rewardCoins,
  }
}

const diceOddEven = {
  create,
  execute,
}

export default diceOddEven
