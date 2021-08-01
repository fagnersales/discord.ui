import { MessageReaction } from "discord.js";

export const reactedWithEmoji = (messageReaction: MessageReaction, emoji: string): boolean => 
  (messageReaction.emoji.id || messageReaction.emoji.name.toLowerCase()) === emoji.toLowerCase()