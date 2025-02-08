require('dotenv').config({
  path: `${__dirname}/../${process.env['NODE_ENV'] === 'development' ? '.env.local' : '.env'}`,
})

import { Client, Events, GatewayIntentBits, Partials } from 'discord.js'
import handleInteraction from './handleInteraction'
import handleMessage from './handleMessage'
import handleReady from './handleReady'
import handleVoiceStateUpdate from './handleVoiceStateUpdate'

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

client.login(process.env['TOKEN'])
