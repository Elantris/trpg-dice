import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js'
import OpenColor from 'open-color'
import { GameNames, type GameProps } from '../utils/cache'
import colorFormatter from '../utils/colorFormatter'
import pick from '../utils/pick'
import randInt from '../utils/randInt'

type Pattern = 'random' | 'single' | 'pair' | 'triple'
const symbols = [
  'cherries',
  'strawberry',
  'grapes',
  'lemon',
  'tangerine',
  'apple',
  'pear',
  'peach',
  'pineapple',
  'watermelon',
  'seven',
]
const lostMessages = [
  '結果是一無所獲',
  '然而什麼都沒有',
  '也許下次會更好',
  '再來一把一定行',
  '感覺到了，再來一次一定中',
  '難過的是放棄的夢被打碎',
  '幸運之神憐憫地看著你',
  '這是一句好話再試一下',
]

const slotMachinePrizes: {
  prize: number
  symbol: string
  pattern: Pattern
  weight: number
}[] = [
  // empty
  { prize: 0, symbol: '', pattern: 'random', weight: 987654321 },

  // gem
  { prize: 10, symbol: 'gem', pattern: 'single', weight: 65432 },
  { prize: 100, symbol: 'gem', pattern: 'pair', weight: 6543 },
  { prize: 1000, symbol: 'gem', pattern: 'triple', weight: 654 },

  // pair
  { prize: 1, symbol: symbols[0], pattern: 'pair', weight: 87654321 },
  { prize: 2, symbol: symbols[1], pattern: 'pair', weight: 43827160 },
  { prize: 3, symbol: symbols[2], pattern: 'pair', weight: 29218107 },
  { prize: 5, symbol: symbols[3], pattern: 'pair', weight: 17530864 },
  { prize: 7, symbol: symbols[4], pattern: 'pair', weight: 12522045 },
  { prize: 10, symbol: symbols[5], pattern: 'pair', weight: 8765432 },
  { prize: 15, symbol: symbols[6], pattern: 'pair', weight: 5843621 },
  { prize: 20, symbol: symbols[7], pattern: 'pair', weight: 4382716 },
  { prize: 30, symbol: symbols[8], pattern: 'pair', weight: 2921810 },
  { prize: 50, symbol: symbols[9], pattern: 'pair', weight: 1753086 },

  // triple
  { prize: 10, symbol: symbols[0], pattern: 'triple', weight: 765432 },
  { prize: 20, symbol: symbols[1], pattern: 'triple', weight: 382716 },
  { prize: 30, symbol: symbols[2], pattern: 'triple', weight: 255144 },
  { prize: 50, symbol: symbols[3], pattern: 'triple', weight: 153086 },
  { prize: 70, symbol: symbols[4], pattern: 'triple', weight: 109347 },
  { prize: 100, symbol: symbols[5], pattern: 'triple', weight: 76543 },
  { prize: 150, symbol: symbols[6], pattern: 'triple', weight: 51028 },
  { prize: 200, symbol: symbols[7], pattern: 'triple', weight: 38271 },
  { prize: 300, symbol: symbols[8], pattern: 'triple', weight: 25514 },
  { prize: 500, symbol: symbols[9], pattern: 'triple', weight: 15308 },
  { prize: 777, symbol: symbols[10], pattern: 'triple', weight: 9851 },
]
const totalWeight = slotMachinePrizes.reduce(
  (prev, curr) => prev + curr.weight,
  0,
)
const hitRate = (
  ((totalWeight - slotMachinePrizes[0].weight) * 100) /
  totalWeight
).toFixed(4)
const returnToPlayer =
  (slotMachinePrizes.reduce((prev, curr) => {
    return prev + curr.prize * curr.weight
  }, 0) *
    100) /
  totalWeight

const generateSlotContent = (pattern: Pattern, symbol: string) => {
  const result: string[] = new Array(3)
  switch (pattern) {
    case 'pair':
      const index = randInt(0, 1)
      const restIndex = index === 0 ? 2 : 0
      result[index] = result[index + 1] = symbol
      result[restIndex] = pick(symbols.filter((v) => v !== symbol))
      break

    case 'triple':
      result[0] = result[1] = result[2] = symbol
      break

    default:
      result[0] = pick(symbols)
      result[1] = pick(symbols)
      result[2] = pick(symbols)
      if (symbol) {
        result[randInt(0, 2)] = symbol
      }
      if (result[0] === result[1] || result[1] === result[2]) {
        result[1] = pick(
          symbols.filter((v) => v !== result[0] && v !== result[2]),
        )
      }
      break
  }
  return result.map((v) => `:${v}:`).join('')
}

const create: GameProps['create'] = async (interaction) => {
  const gameBet = interaction.options.getInteger('bet', true)

  return await interaction.reply({
    content: `:slot_machine: ${GameNames.slotMachine}，每次下注 :coin: ${gameBet}`,
    embeds: [
      {
        color: colorFormatter(OpenColor.orange[5]),
        title: '遊戲規則',
        description: `轉動 eeDice 設置的拉霸機，轉出特定符號組合獲得獎勵倍數。\n中獎率：${hitRate}%，期望值：${returnToPlayer}%`,
        fields: [
          {
            name: '兩個相連',
            value: slotMachinePrizes
              .filter((v) => v.pattern === 'pair' && v.symbol !== 'gem')
              .map((v) => `:${v.symbol}::${v.symbol}: ${v.prize}x`)
              .join('\n'),
            inline: true,
          },
          {
            name: '三個相同',
            value: slotMachinePrizes
              .filter((v) => v.pattern === 'triple' && v.symbol !== 'gem')
              .map((v) => `:${v.symbol}::${v.symbol}::${v.symbol}: ${v.prize}x`)
              .join('\n'),
            inline: true,
          },
          {
            name: '特殊組合',
            value: `
:gem: 10x
:gem::gem: 100x
:gem::gem::gem: 1000x
`.trim(),
            inline: true,
          },
        ],
      },
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_slotMachine_${gameBet}_spin`)
            .setLabel('轉動')
            .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_slotMachine_${gameBet}_end`)
            .setLabel('結束')
            .setStyle(ButtonStyle.Danger),
        ),
    ],
    withResponse: true,
  })
}

const execute: GameProps['execute'] = async (interaction) => {
  const [, , gameBet, action] = interaction.customId.split('_')

  if (action !== 'spin') {
    await interaction.reply({
      content: ':x: 未知的動作',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const luck = randInt(1, totalWeight)
  let tmpLuck = luck
  let resultItem = slotMachinePrizes[0]
  for (let i = 0; i !== slotMachinePrizes.length; i++) {
    tmpLuck -= slotMachinePrizes[i].weight
    if (tmpLuck <= 0) {
      resultItem = slotMachinePrizes[i]
      break
    }
  }

  const slotContent = generateSlotContent(resultItem.pattern, resultItem.symbol)
  const isWinning = resultItem.prize > 0
  const rewardCoins = isWinning ? Number(gameBet) * resultItem.prize : 0

  const content = `:slot_machine: <@!${interaction.user.id}> 轉動拉霸機：「${slotContent}」，${isWinning ? `獲得 :coin: ${rewardCoins}` : pick(lostMessages)}`

  return {
    content,
    luck,
    result: `${slotContent} ${((resultItem.weight * 100) / totalWeight).toFixed(4)}%`,
    rewardCoins,
  }
}

const slotMachine = {
  create,
  execute,
}

export default slotMachine
