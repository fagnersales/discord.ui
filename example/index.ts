import 'dotenv/config'
import { Client } from 'discord.js'

/* Commands */
import { AuthCommand } from './commands/auth'
import { RegisterCommand } from './commands/register'

const client = new Client()

client.on('ready', () => console.log('logged in.'))

client.on('message', (message) => {
  const isOwner = ['403925985847934976', '474407357649256448'].includes(message.author.id)
  if (isOwner  && message.content === '!auth') {
    const authCommand = new AuthCommand()
    return authCommand.exec(message)
  }
  
  if (isOwner && message.content === '!reg') {
    const registerCommand = new RegisterCommand()
    return registerCommand.exec(message)
  }
})

client.login(process.env.DISCORD_BOT_TOKEN!)