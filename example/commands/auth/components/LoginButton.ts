import { UI, Button, ButtonInteractDTO } from '../../../../src'
import { Message, TextChannel } from 'discord.js'

import { usernameContentField } from './Login/usernameContentField'
import { passwordContentField } from './Login/passwordContentField'

export class LoginButton extends Button {
  async interact({ usedMessage, user }: ButtonInteractDTO): Promise<any> {
    const usernameField = usernameContentField()
    const passwordField = passwordContentField()

    const loginUI = new UI({
      components: [
        usernameField,
        passwordField
      ]
    })

    this.getParent()?.setChildren(loginUI)

    loginUI.setup({
      channel: usedMessage.channel as TextChannel,
      user: user,
      messageToUse: usedMessage,
      canBack: true
    })

    loginUI.on('done', (usedMessage: Message) => {
      const { username } = loginUI.getContentFieldResults()
      
      usedMessage.delete()
      usedMessage.channel.send(`Você terminou o formulário de autenticação e logou como: **${username}**!`)
    })
  }

  clone(): LoginButton {
    return new LoginButton({
      description: this.description,
      emoji: this.emoji,
      name: this.name,
      extra: this.extra,
      activated: this.activated
    })
  }
}