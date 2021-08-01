import { MessageReaction } from 'discord.js'

export const hasClientReaction = (messageReaction: MessageReaction): boolean =>
  messageReaction.users.cache.has(messageReaction.client.user?.id as string)