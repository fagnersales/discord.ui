import { Button, ButtonInteractDTO, UI } from '../../../../src'
import { Message, TextChannel } from 'discord.js'

import { usernameContentField } from './Register/usernameContentField'
import { emailContentField } from './Register/emailContentField'
import { passwordContentField } from './Register/passwordContentField'
import { confirmPasswordContentField } from './Register/confirmPasswordContentField'

export class RegisterButton extends Button {
  async interact(data: ButtonInteractDTO): Promise<any> {
    const { usedMessage, user } = data

    const usernameField = usernameContentField()
    const emailField = emailContentField()
    const passwordField = passwordContentField()
    const confirmPasswordField = confirmPasswordContentField(passwordField)

    const registerUI = new UI({
      components: [
        usernameField,
        emailField,
        passwordField,
        confirmPasswordField
      ]
    })
    
    this.getParent()?.setChildren(registerUI)

    registerUI.setup({
      channel: usedMessage.channel as TextChannel,
      user: user,
      canBack: true,
      messageToUse: usedMessage,
      removeReactions: false
    })

    registerUI.on('done', (usedMessage: Message) => {
      const { username } = registerUI.getContentFieldResults()
      usedMessage.delete()
      usedMessage.channel.send(`Você terminou o registro de sua conta **${username}**!`)
    })
  }

  clone(): RegisterButton {
    return new RegisterButton({
      description: this.description,
      emoji: this.emoji,
      name: this.name,
      extra: this.extra,
      activated: this.activated
    })
  }
}