import { MessageActionRow, MessageSelectMenu, User } from 'discord.js'
import { Base } from './Base'
import { once } from 'events'

import {
  ListFieldConstructor,
  ListFieldSetupDTO,
  ListFieldSetupOptions,
  ListElement
} from './IListField'

export class ListField extends Base {
  readonly key: ListFieldConstructor['key']
  readonly list: Record<string, ListElement>
  readonly amount: ListFieldConstructor['amount']

  private _required: boolean = true
  private _value: string[] = []
  private _activated: boolean = false

  public content: string[] = []
  private _completed: boolean = false

  constructor(data: ListFieldConstructor) {
    super({
      name: data.name,
      description: data.description
    })
    this.key = data.key
    this.amount = data.amount
    this._required = data.required ?? true

    this.list = Object.keys(data.list).reduce((acc, cur) => {
      const value = data.list[cur]
      if (typeof value === 'string') {
        return ({ ...acc, [cur]: { name: value, key: value } })
      } else {
        return ({ ...acc, [cur]: value })
      }
    }, {} as Record<string, ListElement>)
  }

  get completed(): boolean {
    return this._completed
  }

  get required(): boolean {
    return this._required
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
    this._completed = false
  }

  isListField(): this is ListField {
    return true
  }

  async setup(data: ListFieldSetupDTO, options?: ListFieldSetupOptions): Promise<boolean> {
    this.on('stop', () => this.emit('done', false))
    const selectorOptions = Object.keys(this.list)
      .map((emoji) => {
        return {
          label: this.list[emoji].name,
          value: this.list[emoji].key,
          description: this.list[emoji].description,
          emoji
        }
      })

    const id = `${Date.now()}-selector`

    const selector = new MessageSelectMenu()
      .setCustomId(id)
      .setPlaceholder(this.description)
      .addOptions(selectorOptions)

    if (this.amount.specified) {
      selector.setMinValues(this.amount.specified)
      selector.setMaxValues(this.amount.specified)
    }

    if (this.amount.moreThan) {
      selector.setMinValues(this.amount.moreThan)
      selector.setMaxValues(selector.options.length)
    }

    const selectorRow = new MessageActionRow().addComponents(selector)

    const oldComponents = [...data.messageToUse.components]

    await data.messageToUse.edit({
      components: [...oldComponents, selectorRow]
    })

    const selectorCollector = data.messageToUse.createMessageComponentCollector({
      componentType: 'SELECT_MENU',
      filter: (interaction) => interaction.user.equals(data.user) && interaction.customId === id,
      max: 1,
      maxComponents: 1,
    })

    selectorCollector.once('collect', async (interaction) => {
      if (interaction.isSelectMenu()) {
        this.value = interaction.values
        this.content = interaction.values
          .map(value => {
            const option = selectorOptions.find(option => option.value === value)
            return option ? option.label : null
          })
          .filter((label): label is string => label !== null)

        await interaction.update({
          components: oldComponents
        })

        this._completed = true
        this.emit('done')
      }
    })

    await once(this, 'done')

    return true
  }
}

export * from './IListField'