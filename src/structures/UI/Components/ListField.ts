import { Message, MessageReaction, User } from 'discord.js'
import { BaseConstructor, Base, BaseSetupDTO } from './Base'
import { once } from 'events'
import { hasClientReaction, reactedWithEmoji } from '@src/utils'

export type ListFieldConstructor = BaseConstructor & {
  key: string
  list: Record<string, string | { name: string, key: string }>
  required?: boolean
  amount: {
    specified: number
    moreThan?: number
  } | {
    specified?: number
    moreThan: number
  }
}

export type ListFieldSetupDTO = BaseSetupDTO & {}

export type ListFieldSetupOptions = Partial<{
  confirmationEmoji: string
  time: number
}>

export class ListField extends Base {
  readonly key: ListFieldConstructor['key']
  readonly list: Record<string, { name: string, key: string }>
  readonly amount: ListFieldConstructor['amount']
  readonly required: ListFieldConstructor['required']

  private _value: string[] = []
  private _activated: boolean = false
  
  public content: string[] = []
  public completed: boolean = false

  constructor(data: ListFieldConstructor) {
    super({
      name: data.name,
      description: data.description
    })
    this.key = data.key
    this.amount = data.amount
    this.required = data.required ?? true

    this.list = Object.keys(data.list).reduce((acc, cur) => {
      const value = data.list[cur]
      if (typeof value === 'string') {
        return ({ ...acc, [cur]: { name: value, key: value } })
      } else {
        return ({ ...acc, [cur]: value })
      }
    }, { } as Record<string, { name: string, key: string }>)
  }

  get value() {
    return this._value
  }

  set value(newValue: string[]) {
    this._value = newValue
  }

  get activated(): boolean {
    return this._activated
  }

  activate(): void {
    this._activated = true
  }

  deactivate(): void {
    this._activated = false
  }

  clear(): void {
    this.deactivate()
    this._value = []
    this.content = []
    this.completed = false
  }

  isListField(): this is ListField {
    return true
  }

  async setup(data: ListFieldSetupDTO, options?: ListFieldSetupOptions): Promise<boolean> {
    const { channel, user } = data
    const emojis = Object.keys(this.list)
    const confirmEmoji = options?.confirmationEmoji ?? '✅'

    const content = emojis
      .map(emoji => `${emoji} ${this.list[emoji]?.name}`)
      .join('\n')

    const usedMessage = await channel.send(content)

    Promise.all(emojis.map(emoji => usedMessage.react(emoji)))

    const userReactions = () => {
      const reactions = usedMessage.reactions.cache

      return reactions.filter(reaction => (
        reaction.users.cache.has(user.id) &&
        !reactedWithEmoji(reaction, confirmEmoji)
      ))
    }

    const canConfirm = () => {
      const size = userReactions().size
      if (!this.required && size === 0) return true 
      if (this.amount.specified) return size === this.amount.specified
      if (this.amount.moreThan) return size >= this.amount.moreThan 
      return false
    }

    const confirmFilter = (messageReaction: MessageReaction, reactedUser: User) => (
      reactedUser.equals(user) &&
      canConfirm() &&
      reactedWithEmoji(messageReaction, confirmEmoji)
    )

    const confirmCollector = usedMessage.createReactionCollector(
      confirmFilter, { max: 1, time: options?.time }
    )

    if (canConfirm()) usedMessage.react(confirmEmoji)

    const listFilter = (messageReaction: MessageReaction, reactedUser: User) => (
      reactedUser.equals(user) &&
      emojis.includes(messageReaction.emoji.id || messageReaction.emoji.name)
    )

    const listCollector = usedMessage.createReactionCollector(
      listFilter, { dispose: true, time: options?.time }
    )

    const checkConfirmReaction = () => {
      if (canConfirm()) {
        usedMessage.react(confirmEmoji)
        this.completed = true
      } else {
        const reaction = usedMessage.reactions.cache.find(reaction => (
          hasClientReaction(reaction) &&
          reactedWithEmoji(reaction, confirmEmoji)
        ))

        if (reaction) reaction?.users.remove(usedMessage.client.user?.id as string)

        this.completed = false
      }
    }

    listCollector.on('collect', checkConfirmReaction)
    listCollector.on('remove', checkConfirmReaction)

    const result = await once(confirmCollector, 'end')

    const values: ({ name: string, key: string })[] = userReactions().map(reaction => this.list[reaction.emoji.id || reaction.emoji.name]) 

    this.value = values.map(value => value.key)
    this.content = values.map(value => value.name)
    this.completed = true

    return (usedMessage.deletable && usedMessage.delete(), result[1] === 'limit')
  }
}
