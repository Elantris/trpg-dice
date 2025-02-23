import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js'
import OpenColor from 'open-color' with { type: 'json' }
import { GameNames, GameProps, guildMemberCoins } from '../utils/cache.js'
import colorFormatter from '../utils/colorFormatter.js'
import pick from '../utils/pick.js'
import randInt from '../utils/randInt.js'

type Pattern = 'random' | 'single' | 'pair' | 'triple'
const symbols = [
  ':cherries:',
  ':strawberry:',
  ':grapes:',
  ':lemon:',
  ':tangerine:',
  ':apple:',
  ':pear:',
  ':peach:',
  ':pineapple:',
  ':watermelon:',
  ':seven:',
]
const lostMessages = [
  '結果是一無所獲',
  '然而什麼都沒有',
  '也許下次會更好',
  '再來一把一定行',
  '感覺到了，再來一次一定中',
  '難過的是放棄的夢被打碎',
  '幸運之神憐憫地看著你',
  '別氣餒，下次一定會中',
  '運氣只是遲到了，再試一次',
  '今天沒中，明天好運降臨',
  '沒關係，積累運氣更重要',
  '再來一次，也許幸運就在下一刻',
  '每一次挑戰，都是通往幸運的旅程',
  '機會還很多，繼續加油',
  '幸運女神正在趕來的路上',
  '這次沒中，但你已經離大獎更近了',
  '堅持下去，好運終將降臨',
  '這運氣，連系統都忍不住想幫你加油',
  '幸運之神可能在午休，再試試看',
  '沒中？可能是天意讓你再挑戰一次',
]

const slotMachinePrizes: {
  prize: number
  symbol: string
  pattern: Pattern
  weight: number
}[] = [
  // empty
  { prize: 0, symbol: '', pattern: 'random', weight: 7617 },

  // gem
  { prize: 1, symbol: ':gem:', pattern: 'single', weight: 500 },
  { prize: 10, symbol: ':gem:', pattern: 'pair', weight: 10 },
  { prize: 100, symbol: ':gem:', pattern: 'triple', weight: 1 },

  // pair
  { prize: 1, symbol: symbols[2], pattern: 'pair', weight: 600 },
  { prize: 2, symbol: symbols[3], pattern: 'pair', weight: 100 },
  { prize: 3, symbol: symbols[4], pattern: 'pair', weight: 100 },
  { prize: 5, symbol: symbols[5], pattern: 'pair', weight: 100 },
  { prize: 7, symbol: symbols[6], pattern: 'pair', weight: 100 },
  { prize: 10, symbol: symbols[7], pattern: 'pair', weight: 10 },
  { prize: 20, symbol: symbols[8], pattern: 'pair', weight: 10 },
  { prize: 30, symbol: symbols[9], pattern: 'pair', weight: 10 },

  // triple
  { prize: 1, symbol: symbols[0], pattern: 'triple', weight: 400 },
  { prize: 2, symbol: symbols[1], pattern: 'triple', weight: 100 },
  { prize: 3, symbol: symbols[2], pattern: 'triple', weight: 100 },
  { prize: 5, symbol: symbols[3], pattern: 'triple', weight: 100 },
  { prize: 7, symbol: symbols[4], pattern: 'triple', weight: 100 },
  { prize: 10, symbol: symbols[5], pattern: 'triple', weight: 10 },
  { prize: 20, symbol: symbols[6], pattern: 'triple', weight: 10 },
  { prize: 30, symbol: symbols[7], pattern: 'triple', weight: 10 },
  { prize: 50, symbol: symbols[8], pattern: 'triple', weight: 10 },
  { prize: 100, symbol: symbols[9], pattern: 'triple', weight: 1 },
  { prize: 777, symbol: symbols[10], pattern: 'triple', weight: 1 },
]
const totalWeight = slotMachinePrizes.reduce(
  (prev, curr) => prev + curr.weight,
  0,
)
const hitRate = (
  ((totalWeight - slotMachinePrizes[0].weight) * 100) /
  totalWeight
).toFixed(2)
const returnToPlayer = (
  (slotMachinePrizes.reduce(
    (prev, curr) => prev + curr.prize * curr.weight,
    0,
  ) *
    100) /
  totalWeight
).toFixed(2)

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
  return result.join('')
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
            name: '三個相同',
            value: slotMachinePrizes
              .filter((v) => v.pattern === 'triple' && v.symbol !== ':gem:')
              .map((v) => `${v.symbol}${v.symbol}${v.symbol} ${v.prize}x`)
              .join('\n'),
            inline: true,
          },
          {
            name: '其他獎項',
            value: `
:gem: 1x
:gem::gem: 10x
:gem::gem::gem: 100x
${slotMachinePrizes
  .filter((v) => v.pattern === 'pair' && v.symbol !== ':gem:')
  .map((v) => `${v.symbol}${v.symbol} ${v.prize}x`)
  .join('\n')}
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
            .setCustomId(`game_slotMachine_${gameBet}_spin5x`)
            .setLabel('五倍轉動')
            .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_slotMachine_${gameBet}_spin10x`)
            .setLabel('十倍轉動')
            .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game_slotMachine_${gameBet}_check`)
            .setLabel('查看')
            .setStyle(ButtonStyle.Success),
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

  if (action !== 'spin' && action !== 'spin5x' && action !== 'spin10x') {
    await interaction.reply({
      content: ':x: 未知的動作',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const betCoins =
    Number(gameBet) * (action === 'spin5x' ? 5 : action === 'spin10x' ? 10 : 1)
  const memberCoins =
    guildMemberCoins[interaction.guildId!]![interaction.user.id]!

  if (memberCoins < betCoins) {
    await interaction.reply({
      content: `:x: 參加遊戲需要 :coin: ${gameBet}，你目前擁有 :coin: ${memberCoins}`,
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
  const rewardCoins = isWinning ? betCoins * resultItem.prize : 0

  const content = `:slot_machine: <@!${interaction.user.id}> ${action === 'spin5x' ? '下注五倍' : action === 'spin10x' ? '下注十倍' : ''}轉動拉霸機：「${slotContent}」，${isWinning ? `獲得 :coin: ${rewardCoins}` : pick(lostMessages)}`

  return {
    content,
    luck,
    result: `${slotContent} ${((resultItem.weight * 100) / totalWeight).toFixed(2)}%`,
    betCoins,
    rewardCoins,
  }
}

const slotMachine = {
  create,
  execute,
}

export default slotMachine
