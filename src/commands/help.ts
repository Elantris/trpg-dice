import { Message, MessageEmbedOptions } from 'discord.js'
import OpenColor from 'open-color'
import colorFormatter from '../utils/colorFormatter'

const MANUALS: {
  [key in string]?: MessageEmbedOptions
} = {
  default: {
    color: colorFormatter(OpenColor.indigo[5]),
    description: `
:game_die: \`roll\`: 計算一個四則運算的算式，並將其中的骰子語法替換成擲骰結果
:game_die: \`trace\`: 查看一則指令結果的詳細資訊
:game_die: \`poll\`: 建立一則用表情符號投票的訊息
:game_die: \`pick\`: 隨機抽選訊息內容中的其中一個選項
`.trim(),
  },
  roll: {
    color: colorFormatter(OpenColor.indigo[5]),
    description: `
:game_die: **Roll Dice**
計算一個四則運算的算式，並將其中的骰子語法替換成擲骰結果
`.trim(),
    fields: [
      {
        name: '語法',
        value: `
\`Roll(Number): Expression\`
1. 前綴 Roll 可簡寫為 R，大小寫皆可
2. (Number) 為重複擲骰次數，可省略，預設 1 次、最多 20 次
3. 冒號後面為一個算式，支援基本四則運算、[骰子語法](https://wiki.rptools.info/index.php/Dice_Expressions)
`.trim(),
      },
      {
        name: '範例',
        value: `
\`Roll: d6 + 2\`
\`r(6): 4d6d1\`
\`r: (2d6 + 2) * 2 + d4\`
`.trim(),
      },
    ],
  },
  trace: {
    color: colorFormatter(OpenColor.indigo[5]),
    description: `
:game_die: **Trace Results**
查看一則指令結果的詳細資訊
`.trim(),
    fields: [
      {
        name: '語法',
        value: `
\`Trace: Message\`
1. 前綴 Trace 可簡寫為 T，大小寫皆可
2. Message 指定一則機器人的訊息，支援訊息連結、訊息 ID
`.trim(),
      },
      {
        name: '範例',
        value: `
\`Trace: https://discord.com/channels/225584441026805760/225660570857111552/908572876058271784\`
\`T: 225660570857111552-908572876058271784\`
\`t: 908572876058271784\`
`.trim(),
      },
    ],
  },
  poll: {
    color: colorFormatter(OpenColor.indigo[5]),
    description: `
:game_die: **Poll**s
建立一則用表情符號投票的訊息
`.trim(),
    fields: [
      {
        name: '語法',
        value: `
\`\`\`
Poll: Question
Choice1
Choice2
Choice3
\`\`\`
1. 第一行包含指令前綴 poll 大小寫皆可，冒號後的內容為問題
2. 第二行開始每一行視為一個選項
`.trim(),
      },
      {
        name: '範例',
        value: `
\`\`\`
Poll: 今天吃什麼
全家
SEVEN
萊爾富
\`\`\`
`.trim(),
      },
    ],
  },
  pick: {
    color: colorFormatter(OpenColor.indigo[5]),
    description: `
:game_die: **Pick**
隨機抽選訊息內容中的其中一個選項
`.trim(),
    fields: [
      {
        name: '語法',
        value: `
\`Pick: Choice1 Choice2 Choice3\`
1. 前綴 Pick 可簡寫為 P，大小寫皆可
2. 冒號後面為選項，以空白分隔
`.trim(),
      },
      {
        name: '範例',
        value: `
Pick: 紅色、綠色、藍色
p: 可以色色 不可以色色
`.trim(),
      },
    ],
  },
}

const help: (message: Message) => Promise<void> = async message => {
  const manual = MANUALS[message.content.split(/[:\s]/)[1].toLowerCase()] || MANUALS['default']

  if (manual) {
    await message.channel.send({
      content: ':game_die: eeDice 指令說明',
      embeds: [manual],
    })
  }
}

export default help
