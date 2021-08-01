import { EventEmitter } from 'events'
import { Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js'
import { Button, ButtonSetupOptions, ListField } from './Components'
import { ContentField, ContentFieldSetupOptions } from './Components'
import { Base } from './Components/Base'

import {
  isMessageUsable,
  removeReaction,
  filterButtons,
  filterContentFields,
  filterListFields,
  genericFilter
} from '../../utils'

export type UIConstructor = {
  components: Base[]
}

export type UISetupDTO = {
  user: User
  channel: TextChannel
  messageToUse?: Message
  canBack?: boolean
  removeReactions?: boolean

  options?: Partial<{
    button: ButtonSetupOptions
    field: ContentFieldSetupOptions
  }>
}

export class UI extends EventEmitter {
  readonly components!: UIConstructor['components']
  readonly listFields: ListField[]
  readonly contentFields: ContentField[]
  readonly buttons: Button[]

  private children: UI | undefined

  constructor(data: UIConstructor) {
    super()

    Object.assign(this, data)

    this.listFields = filterListFields(this.components)
    this.contentFields = filterContentFields(this.components)
    this.buttons = filterButtons(this.components)
  }

  setChildren(ui: UI): void {
    this.children = ui
  }

  getChildren(): UI | undefined {
    return this.children
  }

  private activateAllButtons() {
    this.buttons.forEach(button => button.activate())
    }
    
    private deactivateAllButtons() {
    this.buttons.forEach(button => button.deactivate())
  }

  private deactivateAllFields() {
    this.contentFields.forEach(contentField => 
      contentField.deactivate()
    )

    this.listFields.forEach(listField =>
      listField.deactivate()  
    )
  }

  isCompleted(): boolean {
    return (
      this.contentFields.every(contentField => contentField.completed) &&
      this.listFields.every(listField => listField.completed) 
    )
  }

  getContentFieldResults(): Record<string, ContentField['value']> {
    return this.contentFields.reduce((accumulator, contentField) => (
      { ...accumulator, [contentField.key]: contentField.value }
    ), { } as Record<string, ContentField['value']>)
  }
  
  getListFieldResults(): Record<string, ListField['value']> {
    return this.listFields.reduce((accumulator, listField) => (
      { ...accumulator, [listField.key]: listField.value }
    ), { } as Record<string, ListField['value']>)
  }

  async setup(data: UISetupDTO): Promise<Message> {
    const generalFilter = genericFilter(data.user)

    const createEmbed = (): MessageEmbed => {
      const embed = new MessageEmbed()
      .setColor('RANDOM')

      const handleListFieldComponent = (component: ListField) => {
        const name = component.activated ? `**${component.name}**` : component.name
        const required = component.required ? ':star:' : ''

        embed.setDescription(
          (embed.description || '')
          + `${name}${required} \`\`\`\n${component.content.join(' | ') || '...'}\`\`\``
        )
      }

      const handleContentFieldComponent = (component: ContentField) => {
        const name = component.activated ? `**${component.name}**` : component.name
        const required = component.required ? ':star:' : ''

        embed.setDescription(
          (embed.description || '')
          + `${name}${required} \`\`\`\n${component.content}\`\`\``
        )
      }

      const handleButtonComponent = (component: Button) => {
        embed.setDescription(
          (embed.description || '')
          + `${component.emoji} - ${component.name} | ${component.description}\n`
        )
      }

      for (const component of this.components) {
        if (component.isListField()) handleListFieldComponent(component)
        if (component.isContentField()) handleContentFieldComponent(component)
        if (component.isButton()) handleButtonComponent(component)
      }

      return embed
    }

    const embed = createEmbed()

    const handleMessage = async () => {
      if (!data.messageToUse) return data.channel.send(embed)

      if (data.removeReactions) await data.messageToUse.reactions.removeAll()
      
      if (!isMessageUsable(data.messageToUse)) {
        throw new Error('The message to be used is either not editable or has been deleted')
      }

      return await data.messageToUse.edit('', embed)
    }

    const usedMessage = await handleMessage()
    const DEFAULT_TIME = 300000

    for (const component of this.components) {
      if (component.isContentField() || component.isListField()) {
        if (component.completed) continue
        
        this.deactivateAllFields()
        component.activate()

        await usedMessage.edit('', createEmbed())

        const result = await component.setup({
          channel: data.channel,
          user: data.user
        }, { time: DEFAULT_TIME, ...data.options?.field })

        if (!result) return usedMessage

        if (!isMessageUsable(usedMessage)) {
          throw new Error('The message to be used is either not editable or has been deleted')
        }

        await usedMessage.edit('', createEmbed())
      }
    }

    if (!this.buttons.length && this.isCompleted()) {
      usedMessage.react('✅')
      usedMessage.react('🔄')

      const removeReactions = () => (
        removeReaction(usedMessage, '✅'),
        removeReaction(usedMessage, '🔄')
      )

      const genericOptions = { max: 1, time: 60000 }

      const repeater = usedMessage.createReactionCollector(generalFilter('🔄'), genericOptions)
      const finalizer = usedMessage.createReactionCollector(generalFilter('✅'), genericOptions)

      const stopCollectors = async () => (
        await removeReactions(),
        !repeater.ended && repeater.stop(),
        !finalizer.ended && finalizer.stop()
      )

      finalizer.on('collect', async () => {
        await stopCollectors()

        this.emit('done', usedMessage)
      })

      repeater.on('collect', async () => {
        stopCollectors()
        
        this.components.forEach(component => {
          if (component.isListField() || component.isContentField()) {
            component.clear()
          }
        })

        this.setup({ messageToUse: usedMessage, ...data })
      })
    }

    this.buttons.forEach(button => button.setParent(this))

    const buttonsSetupPromise = this.buttons.map(button => button.setup({
      usedMessage,
      user: data.user,
      channel: data.channel
    }, { time: DEFAULT_TIME, ...data.options?.button })
    .then((result) => result ? button : null))

    const buttonClicked = await Promise.race(buttonsSetupPromise)

    this.deactivateAllButtons()

    if (buttonClicked) {
      usedMessage.reactions.removeAll()

      if (data.canBack && isMessageUsable(usedMessage)) {
        usedMessage.react('◀')

        const backOptions = { max: 1, time: DEFAULT_TIME }

        const backCollector = usedMessage.createReactionCollector(generalFilter('◀'), backOptions)
        
        backCollector.on('collect', () => {
          buttonClicked.deactivate()
          this.activateAllButtons()

          this.children?.contentFields.forEach(contentField => {
            contentField.emit('stop')
          })
          
          this.children?.listFields.forEach(listField => {
            listField.emit('stop')
          })

          this.setup({ ...data, messageToUse: usedMessage })
        })
      }

      await buttonClicked.interact({
        usedMessage,
        user: data.user
      })
    }

    return usedMessage
  }
}