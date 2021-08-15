import { BaseContent } from './BaseContent'
import { ContentFieldConstructor, ContentFieldSetupDTO, ContentFieldSetupOptions } from './IContentField'

import { Message, MessageActionRow, MessageButton } from 'discord.js'
import { once } from 'events'

export class ContentField extends BaseContent {
  readonly key: ContentFieldConstructor['key']
  readonly options: ContentFieldConstructor['options']
  readonly filter: ContentFieldConstructor['filter']
  readonly contentResolver: ContentFieldConstructor['contentResolver']
  readonly valueResolver: ContentFieldConstructor['valueResolver']
  readonly placeholder: Required<ContentFieldConstructor>['placeholder']

  readonly required: boolean
  public value: any
  private _content: string

  private _activated: boolean = false
  private _completed: boolean = false

  constructor(data: ContentFieldConstructor) {
    super({
      name: data.name,
      description: data.description
    })
    this.key = data.key
    this.options = { removeCorrectAnswers: true, ...data.options }
    this.placeholder = data.placeholder ?? '...'

    this.filter = data.filter
    this.contentResolver = data.contentResolver
    this.valueResolver = data.valueResolver

    this.required = data.required ?? true
    this._content = this.placeholder
  }

  
  /* abstract method from Base */
  isContentField(): this is ContentField {
    return true
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
    this._content = this.placeholder
    this.value = undefined
  }

  get content(): string {
    return this._content
  }

  private setContent(content: string) {
    this._content = content
    this._completed = true
  }

  private async resolve(message: Message): Promise<void> {
    const content = await this.contentResolver(message)
    const newValue = await this.valueResolver(message)
    this.value = newValue
    this.setContent(content)
  }

  async setup(data: ContentFieldSetupDTO, options?: ContentFieldSetupOptions): Promise<boolean> {
    this.once('stop', () => this.emit('confirmed', false))

    console.log(`${this.name} is setting up!`)
    const canConfirm = () => (
      this._activated &&
        this.required ? this._completed : true
    )

    const confirmButton = new MessageButton()
      .setCustomId(`confirm-content-field${Date.now()}`)
      .setDisabled(!canConfirm())
      .setLabel('Eu respondi!')
      .setStyle('PRIMARY')

    const confirmRow = () => new MessageActionRow()
      .addComponents(confirmButton)

    const usedMessage = await data.channel.send({
      content: this.description,
      components: [confirmRow()]
    })

    const contentCollectorFilter = (message: Message) => (
      !!this.activated &&
      message.author.equals(data.user)
    )

    const contentCollector = data.channel.createMessageCollector({
      filter: contentCollectorFilter, time: options?.time
    })

    if (this.options?.removeAllAnswers || this.options?.removeCorrectAnswers) {
      const userAnswersCollector = data.channel.createMessageCollector({
        filter: m => m.author.equals(data.user)
      })

      this.on('confirmed', () => {
        userAnswersCollector.stop()

        const deleteMessage = async (message: Message) => {
          try {
            const fetchedMessage = await message.fetch(true) 
            await fetchedMessage.delete()
          } catch (error) {
            if (error.message !== 'Unknown Message') {
              throw new Error(error)
            }
          }
        }

        userAnswersCollector.collected.forEach(deleteMessage)
      })
    }

    /* Collect user answer */
    contentCollector.on('collect', async (message) => {
      const result = await this.filter(message)

      /* If the test didn't succeeded */
      if (typeof result === 'string') {
        if (!confirmButton.disabled) {
          confirmButton.setDisabled(true)
          await usedMessage.edit({ components: [confirmRow()] })
        }

        if (this.options?.removeAllAnswers || this.options?.removeIncorrectAnswers) {
          if (message.deletable) message.delete()
        }

        data.channel.send(result)
          .then((errorMessage) => {
            setTimeout(() => errorMessage.delete(), 4000)
          })

        return;
      }

      await this.resolve(message)
      confirmButton.setDisabled(false)

      await usedMessage.edit({ components: [confirmRow()] })
    })

    usedMessage.client.on('interactionCreate', interaction => {
      if (
        interaction.isButton() &&
        interaction.customId.startsWith('confirm-content-field')
      ) {
        if (this.completed) this.emit('confirmed', true)
      }
    })

    const [confirmed] = await once(this, 'confirmed') as [boolean]

    if (usedMessage.deletable) usedMessage.delete()
    contentCollector.stop()

    return confirmed
  }

}

export * from './IContentField'