import { Guild, PermissionFlagsBits } from 'discord.js'

const isAdmin = (guild: Guild, userId: string) => {
  const member = guild.members.cache.get(userId)
  return !!member?.permissions.has(PermissionFlagsBits.Administrator)
}

export default isAdmin
