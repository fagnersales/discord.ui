import { Base, BaseConstructor, BaseSetupDTO } from './Base'

import { Message, MessageReaction, User } from 'discord.js'
import { once } from 'events'
import { isMessageUsable } from '@src/utils'

export type ContentFieldFilter = (message: Message) => Promise<true | string>
export type ContentFieldContentResolver = (message: Message) => Promise<string>
export type ContentFieldValueResolver = (message: Message) => Promise<any>

export type ContentFieldConstructor = BaseConstructor & {
  key: string

  filter: ContentFieldFilter
  contentResolver: ContentFieldContentResolver
  valueResolver: ContentFieldValueResolver

  activated?: boolean
  required?: boolean
  placeholder?: string 
  extra?: any

  options?: Partial<{
    removeAnswers: boolean
  }>
}

export type ContentFieldSetupDTO = BaseSetupDTO & {}

export type ContentFieldSetupOptions = Partial<{
  confirmationEmoji: string
  time: number
}>

export class ContentField extends Base {
  readonly key: ContentFieldConstructor['key']
  readonly options: ContentFieldConstructor['options']
  readonly filter: ContentFieldConstructor['filter']
  readonly contentResolver: ContentFieldConstructor['contentResolver']
  readonly valueResolver?: ContentFieldConstructor['valueResolver']
  readonly placeholder?: ContentFieldConstructor['placeholder']

  readonly required: boolean
  public value: any

  private _content: string
  private _activated: boolean
  private _completed: boolean

  constructor(data: ContentFieldConstructor) {
    super({
      name: data.name,
      description: data.description
    })
    this.key = data.key
    this.options = data.options
    this.placeholder = data.placeholder

    this.filter = data.filter
    this.contentResolver = data.contentResolver
    this.valueResolver = data.valueResolver


    this.required = data.required ?? true
    this._content = data.placeholder || '...'
    this._activated = false
    this._completed = false
  }

  get completed(): boolean {
    return this._completed
  }

  set completed(stats: boolean) {
    this._completed = stats
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

  clear() {
    this._completed = false
    this._content = this.placeholder || '...'
    this.value = undefined
  }

  get content(): string {
    return this._content
  }

  private setContent(content: string) {
    this._content = content
    this._completed = true
  }

  isContentField(): this is ContentField {
    return true
  }

  private async resolve(message: Message) {
    const content = await this.contentResolver(message)
    const newValue = await this.valueResolver?.(message) || content
    this.value = newValue
    this.setContent(content)
  }

  async setup(data: ContentFieldSetupDTO, options?: ContentFieldSetupOptions): Promise<boolean> {
    const confirmationEmoji = options?.confirmationEmoji ?? '✅'

    const usedMessage = await data.channel.send(this.description)

    const canConfirm = () => (
      this._activated &&
      this.required ? this._completed : true
    )

    if (canConfirm()) await isMessageUsable(usedMessage) && usedMessage.react(confirmationEmoji)

    const contentCollectorFilter = (message: Message) => (
      !!this.activated &&
      message.author.equals(data.user)
    )

    const confirmCollectorFilter = (messageReaction: MessageReaction, user: User) => (
      canConfirm() &&
      data.user.equals(user) &&
      !!usedMessage.client.user?.id &&
      messageReaction.users.cache.has(usedMessage.client.user.id) &&
      (messageReaction.emoji.id || messageReaction.emoji.name)  === confirmationEmoji
    )

    const confirmCollector = usedMessage.createReactionCollector(
      confirmCollectorFilter, { max: 1, time: options?.time }
    )

    const contentCollector = data.channel.createMessageCollector(
      contentCollectorFilter, { time: options?.time }
    )

    contentCollector.on('collect', async (message: Message) => {
      await usedMessage.reactions.removeAll()
      
      const result = await this.filter(message)
      
      if (typeof result === 'string') {
        if (this.options?.removeAnswers) isMessageUsable(message) && await message.delete()

        return data.channel.send(result)
        .then((message) => {
          isMessageUsable(message) && message.delete({ timeout: 4000 })
        })
      }

      await this.resolve(message)
      await isMessageUsable(usedMessage) && usedMessage.react(confirmationEmoji)

      if (this.options?.removeAnswers) {
        confirmCollector.once('end', () => isMessageUsable(usedMessage) && message.delete())
      }
    })

    this.once('stop', (reason?: string) => {
      this.deactivate()
      if (!contentCollector.ended) contentCollector.stop(reason)
      if (!confirmCollector.ended) confirmCollector.stop(reason)
      if (usedMessage.deletable) isMessageUsable(usedMessage) && usedMessage.delete()
    })
    
    const result = await once(confirmCollector, 'end')

    if (result[1] === 'limit') this._completed = true

    return (this.emit('stop'), result[1] === 'limit')
  }
}