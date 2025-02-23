import { Client, Events, GatewayIntentBits, Partials } from 'discord.js'
import appConfig from './appConfig.js'
import handleInteraction from './handleInteraction.js'
import handleMessage from './handleMessage.js'
import handleReady from './handleReady.js'
import handleVoiceStateUpdate from './handleVoiceStateUpdate.js'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message],
})

client.on(Events.InteractionCreate, handleInteraction)
client.on(Events.MessageCreate, handleMessage)
client.on(Events.VoiceStateUpdate, handleVoiceStateUpdate)
client.on(Events.ClientReady, handleReady)

client.login(appConfig.TOKEN)
