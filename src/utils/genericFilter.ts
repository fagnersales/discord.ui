import { MessageReaction, User } from 'discord.js'
import { hasClientReaction } from './hasClientReaction'
import { reactedWithEmoji } from './reactedWithEmoji'

export const genericFilter = (targetUser: User) => (emoji: string) => (messageReaction: MessageReaction, user: User) => (
  hasClientReaction(messageReaction) &&
  reactedWithEmoji(messageReaction, emoji) &&
  user.equals(targetUser)
)