import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import OpenColor from 'open-color'
import { GameNames, GameProps } from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'
import randInt from '../utils/randInt'

const create: GameProps['create'] = async (interaction) => {
  const gameBet = interaction.options.getInteger('bet', true)

  return await interaction.reply({
    content: `:dart: ${GameNames.roulette}，每次下注 :coin: ${gameBet}`,
    embeds: [
      {
        color: colorFormatter(OpenColor.orange[5]),
        title: '遊戲規則',
        description: `eeDice 轉動輪盤，玩家可下注在 1x、3x、5x、10x、20x 的區域，如果猜中則獲得下注區域對應的倍數。`,
      },
    ],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`game_roulette_${gameBet}_spin`)
          .setPlaceholder('下注區域')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('1倍')
              .setDescription('1x')
              .setValue('1x'),
            new StringSelectMenuOptionBuilder()
              .setLabel('3倍')
              .setDescription('3x')
              .setValue('3x'),
            new StringSelectMenuOptionBuilder()
              .setLabel('5倍')
              .setDescription('5x')
              .setValue('5x'),
            new StringSelectMenuOptionBuilder()
              .setLabel('10倍')
              .setDescription('10x')
              .setValue('10x'),
            new StringSelectMenuOptionBuilder()
              .setLabel('20倍')
              .setDescription('20x')
              .setValue('20x'),
          ),
      ),
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_roulette_${gameBet}_check`)
            .setLabel('查看')
            .setStyle(ButtonStyle.Success),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_roulette_${gameBet}_end`)
            .setLabel('結束')
            .setStyle(ButtonStyle.Danger),
        ),
    ],
    withResponse: true,
  })
}

const roulettePrizes = [
  { key: '1x', prize: 2, weight: 12 },
  { key: '3x', prize: 4, weight: 6 },
  { key: '5x', prize: 6, weight: 4 },
  { key: '10x', prize: 11, weight: 2 },
  { key: '20x', prize: 21, weight: 1 },
]
const totalWeight = roulettePrizes.reduce((prev, curr) => prev + curr.weight, 0)

const execute: GameProps['execute'] = async (interaction) => {
  if (!interaction.isStringSelectMenu()) {
    return
  }

  const [, , gameBet, action] = interaction.customId.split('_')
  const value = interaction.values[0]

  if (
    action !== 'spin' ||
    (value !== '1x' &&
      value !== '3x' &&
      value !== '5x' &&
      value !== '10x' &&
      value !== '20x')
  ) {
    await interaction.reply({
      content: ':x: 未知的動作',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const luck = randInt(1, totalWeight)
  let tmpLuck = luck
  let resultItem = roulettePrizes[0]
  for (let i = 0; i !== roulettePrizes.length; i++) {
    tmpLuck -= roulettePrizes[i].weight
    if (tmpLuck <= 0) {
      resultItem = roulettePrizes[i]
      break
    }
  }

  const result = resultItem.key
  const isWinning = value === result
  const betCoins = Number(gameBet)
  const rewardCoins = isWinning ? resultItem.prize * betCoins : 0

  const content = `:dart: <@!${interaction.user.id}> 下注「${value.replace('x', '')}」，結果是「${result.replace('x', '')}」${isWinning ? `，獲得 :coin: ${rewardCoins}` : ''}`

  return {
    content,
    luck,
    result,
    betCoins,
    rewardCoins,
  }
}

const roulette = {
  create,
  execute,
}

export default roulette
