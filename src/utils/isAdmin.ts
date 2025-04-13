import { Guild, PermissionFlagsBits } from 'discord.js'
import appConfig from '../appConfig.js'

const isAdmin = (guild: Guild, userId: string) => {
  if (userId === appConfig.ADMIN_ID) {
    return true
  }
  const member = guild.members.cache.get(userId)
  return !!member?.permissions.has(PermissionFlagsBits.Administrator)
}

export default isAdmin
