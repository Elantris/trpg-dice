import { Message, MessageEmbedOptions } from 'discord.js'
import OpenColor from 'open-color'
import colorFormatter from '../utils/colorFormatter'

const MANUALS: {
  [key in 'roll' | 'trace']: MessageEmbedOptions
} = {
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
查看一則指令中所有的擲骰結果
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
}

const help: (message: Message) => Promise<void> = async message => {
  await message.channel.send({
    content: `
:game_die: eeDice 指令列表：
- Roll：計算一個四則運算的算式，並將其中的骰子語法替換成擲骰結果
- Trace：查看一則指令中所有的擲骰結果
`.trim(),
    embeds: Object.values(MANUALS),
  })
}

export default help
