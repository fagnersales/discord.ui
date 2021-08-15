import { BaseConstructor } from './Base'
import { BaseSetupDTO } from './BaseContent'

import { Message } from 'discord.js'

export type ContentFieldFilter = (message: Message) => Promise<true | string>
export type ContentFieldContentResolver = (message: Message) => Promise<string>
export type ContentFieldValueResolver = (message: Message) => Promise<any>

export type ContentFieldConstructor = BaseConstructor & {
  key: string

  filter: ContentFieldFilter
  contentResolver: ContentFieldContentResolver
  valueResolver: ContentFieldValueResolver

  required?: boolean
  placeholder?: string
  extra?: any

  options?: Partial<{
    removeCorrectAnswers: boolean
    removeIncorrectAnswers: boolean
    removeAllAnswers: boolean
  }>
}

export type ContentFieldSetupDTO = BaseSetupDTO & {}

export type ContentFieldSetupOptions = Partial<{
  time: number
}>