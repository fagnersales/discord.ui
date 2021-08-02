import { Message, TextChannel } from 'discord.js'
import { UI } from '../../../src/'

import { GenderList, PreferencesList } from './components/'

export class RegisterCommand {
  async exec(message: Message) {
    const genderList = GenderList()
    const preferencesList = PreferencesList()

    const registerUI = new UI({
      components: [
        genderList,
        preferencesList
      ]
    })

    registerUI.on('done', (usedMessage: Message) => {
      usedMessage.delete()
      
      console.log(registerUI.getListFieldResults())

      usedMessage.channel.send(`Você terminou seu registro!`)
    })

    await registerUI.setup({
      user: message.author,
      channel: message.channel as TextChannel,
      canBack: true,
      removeReactions: true
    })
  }

}