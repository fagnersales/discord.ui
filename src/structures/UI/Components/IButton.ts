import { BaseConstructor } from './Base'
import { Message, User } from 'discord.js'

export type ButtonConstructor<Extra = any> = BaseConstructor & {
  emoji: string
  extra?: Extra
  activated?: boolean
}

export type ButtonInteractDTO = {
  user: User
  usedMessage: Message
}

export type ButtonInteractResult = [
  Message,
  any
]