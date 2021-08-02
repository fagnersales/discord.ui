import { Message, TextChannel } from 'discord.js'
import { UI } from '../../../src/'
import { LoginButton, RegisterButton } from './components/'

export class AuthCommand {
  async exec(message: Message) {
    const loginButton = new LoginButton({
      emoji: '🎨',
      name: 'Login',
      description: 'Logar na sua conta'
    })

    const registerButton = new RegisterButton({
      emoji: '😀',
      name: 'Registrar',
      description: 'Registrar sua conta'
    })

    const authUI = new UI({
      components: [
        loginButton,
        registerButton
      ]
    })

    authUI.setup({
      user: message.author,
      channel: message.channel as TextChannel,
      canBack: true,
      removeReactions: true
    })
  }
}