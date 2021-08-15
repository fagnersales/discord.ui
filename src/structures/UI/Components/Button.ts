import {
  ButtonConstructor,
  ButtonInteractDTO,
  ButtonInteractResult
} from './IButton'

import { UI } from '../UI'
import { Base } from './Base'

export abstract class Button<Extra = any> extends Base {
  readonly emoji: ButtonConstructor['emoji']
  readonly extra: ButtonConstructor<Extra>['extra']

  private parent: UI | undefined
  public activated: boolean

  constructor(data: ButtonConstructor) {
    super({
      name: data.name,
      description: data.description
    })

    this.emoji = data.emoji
    this.extra = data.extra
    this.activated = data.activated ?? true
  }

  isButton(): this is Button {
    return true
  }

  setParent(ui: UI): void {
    this.parent = ui
  }

  getParent(): UI | undefined {
    return this.parent
  }

  deactivate() {
    this.emit('deactivated')
    this.activated = false
  }

  activate() {
    this.emit('activated')
    this.activated = true
  }

  abstract interact(data: ButtonInteractDTO): Promise<ButtonInteractResult>
}

export * from './IButton'