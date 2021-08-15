import { EventEmitter, once } from 'events'
import { Collection, Message, MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed, TextChannel, User } from 'discord.js'
import { Button, ListField } from './Components'
import { ContentField, ContentFieldSetupOptions } from './Components'
import { Base } from './Components/Base'

import {
  isMessageUsable,
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
    ), {} as Record<string, ContentField['value']>)
  }

  getListFieldResults(): Record<string, ListField['value']> {
    return this.listFields.reduce((accumulator, listField) => (
      { ...accumulator, [listField.key]: listField.value }
    ), {} as Record<string, ListField['value']>)
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
      if (!data.messageToUse) return data.channel.send({ embeds: [embed] })

      if (data.removeReactions) await data.messageToUse.reactions.removeAll()

      if (!isMessageUsable(data.messageToUse)) {
        throw new Error('The message to be used is either not editable or has been deleted')
      }

      return await data.messageToUse.edit({ embeds: [embed] })
    }

    const usedMessage = await handleMessage()
    const DEFAULT_TIME = 300000

    for (const component of this.components) {
      if (component.isContentField() || component.isListField()) {
        if (component.completed) continue

        this.deactivateAllFields()
        component.activate()

        await usedMessage.edit({ embeds: [createEmbed()] })

        const result = await component.setup({
          channel: data.channel,
          user: data.user,
          messageToUse: usedMessage
        }, { time: DEFAULT_TIME, ...data.options?.field })

        console.log(`${component.name} is done`)

        if (!result) return usedMessage

        if (!isMessageUsable(usedMessage)) {
          throw new Error('The message to be used is either not editable or has been deleted')
        }

        await usedMessage.edit({ embeds: [createEmbed()] })
      }
    }

    if (!this.buttons.length && this.isCompleted()) {
      console.log('applying Conclude or Redo')

      const conclude = new MessageButton()
        .setLabel('Concluir')
        .setStyle('SUCCESS')
        .setCustomId(`confirm-${Date.now()}`)

      const redo = new MessageButton()
        .setLabel('Refazer')
        .setStyle('DANGER')
        .setCustomId(`redo-${Date.now()}`)

      const concludeRedoRow = new MessageActionRow().addComponents(conclude, redo)

      await usedMessage.edit({
        components: [concludeRedoRow]
      })

      const collector = usedMessage.createMessageComponentCollector({
        filter: (interaction) => (
          interaction.user.equals(data.user) && (
            interaction.customId.startsWith('confirm') ||
            interaction.customId.startsWith('redo')
          )
        ), max: 1
      })

      const [collected, reason] = await once(collector, 'end') as [
        Collection<string, MessageComponentInteraction>,
        string
      ]

      if (reason === 'limit') {
        const interaction = collected.first()!

        const newRows = usedMessage.components.filter(row => {
          return (!row.components.some(component =>
            component.customId && (
              component.customId.startsWith('confirm') ||
              component.customId.startsWith('redo')
            )
          ))
        })

        await interaction.update({ components: newRows })

        if (interaction.customId.startsWith('redo')) {
          this.components.forEach(component => {
            if (component.isListField() || component.isContentField()) {
              component.clear()
            }
          })

          this.setup({ ...data, messageToUse: usedMessage })
        } else {
          this.emit('done', usedMessage)
        }
      }
    } else {
      this.buttons.forEach(button => button.setParent(this))

      const buttonsComponent: MessageButton[] = this.buttons.map(button => {
        return new MessageButton()
          .setCustomId(`ui-button-${Date.now()}-${button.name}`)
          .setEmoji(button.emoji)
          .setLabel(button.name)
          .setStyle('PRIMARY')
      })

      const row = new MessageActionRow().addComponents(...buttonsComponent)

      await usedMessage.edit({
        components: [row]
      })

      const collector = usedMessage.createMessageComponentCollector({
        maxComponents: 1,
        interactionType: 'MESSAGE_COMPONENT',
        componentType: 'BUTTON',
        filter: interaction => interaction.user.equals(data.user)
      })

      collector.on('collect', async (interaction) => {
        if (!interaction.isButton()) return;
        const name = interaction.customId.split('-').reverse()[0]

        const buttonClicked = this.buttons.find(button => {
          return button.name === name
        })

        if (!buttonClicked) return;
        console.log('interaction updated to null | canback components')

        const components: MessageActionRow[] = []

        const canBackButton = new MessageButton()
          .setCustomId(`ui-button-${Date.now()}-canback`)
          .setEmoji('◀')
          .setLabel('Voltar')
          .setStyle('SECONDARY')

        const canBackRow = () => new MessageActionRow().addComponents(canBackButton)

        if (data.canBack) components.push(canBackRow())

        await interaction.update({ components })

        buttonClicked.interact({
          usedMessage: usedMessage,
          user: data.user
        })

        if (data.canBack) {
          const canBackCollector = usedMessage.createMessageComponentCollector({
            filter: interaction => (
              interaction.customId === canBackButton.customId &&
              interaction.user.equals(data.user)
            ),
            componentType: 'BUTTON',
            interactionType: 'MESSAGE_COMPONENT',
            maxComponents: 1,
            max: 1,
            time: DEFAULT_TIME,
          })

          const [collected, reason] = await once(canBackCollector, 'end') as [
            Collection<string, MessageComponentInteraction>,
            string
          ]

          if (reason === 'limit') {
            canBackButton.setDisabled(true)
            
            await collected.first()?.update({
              components: [canBackRow()]
            })

            buttonClicked.deactivate()
            this.activateAllButtons()

            this.children?.contentFields.forEach(contentField => {
              contentField.emit('stop')
            })
  
            this.children?.listFields.forEach(listField => {
              listField.emit('stop')
            })
  
            this.setup({ ...data, messageToUse: usedMessage })
          }
        }
      })
    }


    // this.deactivateAllButtons()

    // if (buttonClicked) {
    //   usedMessage.reactions.removeAll()

    //   if (data.canBack && isMessageUsable(usedMessage)) {
    //     isMessageUsable(usedMessage) && usedMessage.react('◀')

    //     const backOptions = { max: 1, time: DEFAULT_TIME }

    //     const backCollector = usedMessage.createReactionCollector({ filter: generalFilter('◀'), ...backOptions })

    //     backCollector.on('collect', () => {
    //       buttonClicked.deactivate()
    //       this.activateAllButtons()

          
    //     })
    //   }

    //   await buttonClicked.interact({
    //     usedMessage,
    //     user: data.user
    //   })
    // }

    return usedMessage
  }
}