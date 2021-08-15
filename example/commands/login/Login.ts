import { Message, TextChannel } from 'discord.js'
import { UI } from '../../../src/'

import { UsernameContentField, PasswordContentField } from './components/'

export class LoginCommand {
  async exec(message: Message) {
    const usernameContent = UsernameContentField()
    const passwordContent = PasswordContentField()

    const loginUI = new UI({
      components: [
        usernameContent,
        passwordContent
      ]
    })

    loginUI.on('done', (usedMessage: Message) => {
      usedMessage.delete()
      
      console.log(loginUI.getContentFieldResults())

      usedMessage.channel.send(`Você terminou seu registro!`)
    })

    await loginUI.setup({
      user: message.author,
      channel: message.channel as TextChannel,
      canBack: true,
      removeReactions: true
    })
  }

}