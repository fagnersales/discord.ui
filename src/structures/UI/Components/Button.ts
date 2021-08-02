import { isMessageUsable } from '@src/utils'
import { Message, MessageReaction, User } from 'discord.js'
import { once } from 'events'
import { UI } from '../UI'
import { Base, BaseConstructor, BaseSetupDTO } from './Base'

export type ButtonConstructor<Extra = any> = BaseConstructor & {
  emoji: string
  extra?: Extra
  activated?: boolean
}

export type ButtonSetupDTO = BaseSetupDTO & {
  usedMessage: Message
}

export type ButtonSetupOptions = {
  time?: number
}

export type ButtonInteractDTO = {
  user: User
  usedMessage: Message
}

export type ButtonInteractResult = [
  Message,
  any
]

export abstract class Button<Extra = any> extends Base {
  readonly emoji: ButtonConstructor['emoji']
  readonly extra: ButtonConstructor<Extra>['extra']

  private parent: UI | undefined
  public activated: boolean

  constructor(data: ButtonConstructor) {
    super({
      name: data.name,
      description: data.description
    })

    this.emoji = data.emoji
    this.extra = data.extra
    this.activated = data.activated ?? true
  }

  isButton(): this is Button {
    return true
  }

  setParent(ui: UI): void {
    this.parent = ui
  }

  getParent(): UI | undefined {
    return this.parent
  }


  async setup({ usedMessage, user }: ButtonSetupDTO, options?: ButtonSetupOptions): Promise<boolean> {
    await isMessageUsable(usedMessage) && usedMessage.react(this.emoji)

    const collectorFilter = (messageReaction: MessageReaction, userReaction: User) => (
      this.activated &&
      user.equals(userReaction) &&
      (messageReaction.emoji.id || messageReaction.emoji.name) === this.emoji
    )

    const collectorOptions = { max: 1, time: options?.time }

    const collector = usedMessage.createReactionCollector(
      collectorFilter,
      collectorOptions
    )

    const result = await once(collector, 'end')

    return result[1] === 'limit'
  }

  deactivate() {
    this.emit('deactivated')
    this.activated = false
  }
  
  activate() {
    this.emit('activated')
    this.activated = true
  }

  abstract clone(): Button

  abstract interact(data: ButtonInteractDTO): Promise<ButtonInteractResult>
}