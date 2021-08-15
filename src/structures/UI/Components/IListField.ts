import { BaseConstructor } from './Base'
import { BaseSetupDTO } from './BaseContent'

import { Message } from 'discord.js'

export type ListElement = {
  name: string
  key: string
  description?: string
}

export type ListFieldConstructor = BaseConstructor & {
  key: string
  list: Record<string, string | ListElement>
  required?: boolean
  amount: {
    specified: number
    moreThan?: number
  } | {
    specified?: number
    moreThan: number
  }
}

export type ListFieldSetupDTO = BaseSetupDTO & {
  messageToUse: Message
}

export type ListFieldSetupOptions = Partial<{
  confirmationEmoji: string
  time: number
}>
