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
    content: `:coin: ${GameNames.coinFlipping}，每次下注 :coin: ${gameBet}`,
    embeds: [
      {
        color: colorFormatter(OpenColor.orange[5]),
        title: '遊戲規則',
        description:
          'eeDice 丟擲一枚硬幣，玩家猜結果是正面或反面，猜中時獲得兩倍下注點數。丟擲結果正面與反面的機率相同，但有 1% 的機率出現不是正面也不是反面的情況。',
      },
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_coinFlipping_${gameBet}_head`)
            .setLabel('正面')
            .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_coinFlipping_${gameBet}_tail`)
            .setLabel('反面')
            .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_coinFlipping_${gameBet}_check`)
            .setLabel('查看')
            .setStyle(ButtonStyle.Success),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_coinFlipping_${gameBet}_end`)
            .setLabel('結束')
            .setStyle(ButtonStyle.Danger),
        ),
    ],
    withResponse: true,
  })
}

const execute: GameProps['execute'] = async (interaction) => {
  const [, , gameBet, action] = interaction.customId.split('_')

  if (action !== 'head' && action !== 'tail') {
    await interaction.reply({
      content: ':x: 未知的動作',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const luck = randInt(0, 100)
  const result = luck < 50 ? 'head' : luck < 100 ? 'tail' : 'other'
  const isWinning = action === result
  const betCoins = Number(gameBet)
  const rewardCoins = isWinning ? betCoins * 2 : 0

  const content = `:coin: <@!${interaction.user.id}> 下注「${action === 'head' ? '正面' : '反面'}」，結果是「${result === 'head' ? '正面' : result === 'tail' ? '反面' : '卡在縫隙中間！'}」${isWinning ? `，獲得 :coin: ${rewardCoins}` : ''}`

  return {
    content,
    luck,
    result,
    betCoins,
    rewardCoins,
  }
}

const coinFlipping = {
  create,
  execute,
}

export default coinFlipping
