import { TextChannel, User } from 'discord.js'
import { Base } from './Base'

export type BaseSetupDTO = {
  channel: TextChannel
  user: User
}

export abstract class BaseContent extends Base {
  abstract setup(data: BaseSetupDTO): Promise<boolean>
} 