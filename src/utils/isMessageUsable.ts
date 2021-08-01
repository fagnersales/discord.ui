import { Message } from 'discord.js'

export const isMessageUsable = (message: Message): boolean => !message.deleted && message.editable