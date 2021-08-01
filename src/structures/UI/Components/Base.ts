import { TextChannel, User } from 'discord.js'
import { EventEmitter } from 'events'
import { Button } from './Button'
import { ContentField } from './ContentField'
import { ListField } from './ListField'

export type BaseConstructor = {
  name: string
  description: string
}

export type BaseSetupDTO = {
  channel: TextChannel
  user: User
}

export abstract class Base extends EventEmitter {
  readonly name: BaseConstructor['name']
  readonly description: BaseConstructor['description']

  constructor(data: BaseConstructor) {
    super()
    this.name = data.name
    this.description = data.description
  }

  stop(reason?: string) {
    this.emit('stop', reason)
  }

  isButton(): this is Button {
    return false
  }

  isContentField(): this is ContentField {
    return false
  }

  isListField(): this is ListField {
    return false
  }

  abstract setup(data: BaseSetupDTO): Promise<boolean>
}