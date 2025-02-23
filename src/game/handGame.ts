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

const actionNames = {
  scissors: '剪刀',
  rock: '石頭',
  paper: '布',
}

const create: GameProps['create'] = async (interaction) => {
  const gameBet = interaction.options.getInteger('bet', true)

  return await interaction.reply({
    content: `:coin: ${GameNames.handGame}，每次下注 :coin: ${gameBet}`,
    embeds: [
      {
        color: colorFormatter(OpenColor.orange[5]),
        title: '遊戲規則',
        description: '跟 eeDice 玩猜拳，只有猜贏時獲得三倍下注點數。',
      },
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_handGame_${gameBet}_scissors`)
            .setLabel('剪刀')
            .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_handGame_${gameBet}_rock`)
            .setLabel('石頭')
            .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_handGame_${gameBet}_paper`)
            .setLabel('布')
            .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_handGame_${gameBet}_check`)
            .setLabel('查看')
            .setStyle(ButtonStyle.Success),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_handGame_${gameBet}_end`)
            .setLabel('結束')
            .setStyle(ButtonStyle.Danger),
        ),
    ],
    withResponse: true,
  })
}

const execute: GameProps['execute'] = async (interaction) => {
  const [, , gameBet, action] = interaction.customId.split('_')

  if (action !== 'scissors' && action !== 'rock' && action !== 'paper') {
    await interaction.reply({
      content: ':x: 未知的動作',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const luck = randInt(1, 100)
  const result =
    luck === 100
      ? action === 'scissors'
        ? 'rock'
        : action === 'rock'
          ? 'paper'
          : 'scissors'
      : (['scissors', 'rock', 'paper'][luck % 3] as keyof typeof actionNames)
  const isWinning =
    (action === 'scissors' && result === 'paper') ||
    (action === 'rock' && result === 'scissors') ||
    (action === 'paper' && result === 'rock')
  const betCoins = Number(gameBet)
  const rewardCoins = isWinning ? betCoins * 3 : 0

  const content = `:coin: <@!${interaction.user.id}>「${actionNames[action]}」 vs 「${actionNames[result]}」eeDice，${isWinning ? `獲得 :coin: ${rewardCoins}` : '你輸了'}`

  return {
    content,
    luck,
    result,
    betCoins,
    rewardCoins,
  }
}

const handGame = {
  create,
  execute,
}

export default handGame
