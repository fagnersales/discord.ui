import { Message, MessageReaction } from 'discord.js'
import { reactedWithEmoji } from './reactedWithEmoji'

export const removeReaction = async (message: Message, emoji: string): Promise<MessageReaction | undefined> =>
  message.reactions.cache.find(reaction => 
    reactedWithEmoji(reaction, emoji)
  )?.remove()