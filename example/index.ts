import 'dotenv/config'
import { Client, Intents } from 'discord.js'

/* Commands */
import { AuthCommand } from './commands/auth'
import { RegisterCommand } from './commands/register'
import { LoginCommand } from './commands/login'

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
  ]
})

client.on('ready', () => console.log('logged in.'))

client.on('messageCreate', (message) => {
  const isOwner = ['403925985847934976', '474407357649256448'].includes(message.author.id)
  if (isOwner  && message.content === '!auth') {
    const authCommand = new AuthCommand()
    return authCommand.exec(message)
  }
  
  if (isOwner && message.content === '!reg') {
    const registerCommand = new RegisterCommand()
    return registerCommand.exec(message)
  }
  
  if (isOwner && message.content === '!log') {
    const loginCommand = new LoginCommand()
    return loginCommand.exec(message)
  }
})

client.login(process.env.DISCORD_BOT_TOKEN!)