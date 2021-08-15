import { MessageReaction } from "discord.js";

export const reactedWithEmoji = (messageReaction: MessageReaction, emoji: string): boolean => {
  const idOrName = messageReaction.emoji.id || messageReaction.emoji.name
  return idOrName ? idOrName.toLowerCase() === emoji.toLowerCase() : false
}