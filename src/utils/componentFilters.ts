import { Button, ContentField, ListField } from '@structures/UI'
import {  Base } from '../structures/UI/Components/Base'

export const filterListFields = (components: Base[]): ListField[] => 
  components.filter((component): component is ListField => component.isListField())

export const filterContentFields = (components: Base[]): ContentField[] => 
  components.filter((component): component is ContentField => component.isContentField())

export const filterButtons = (components: Base[]): Button[] => 
  components.filter((component): component is Button => component.isButton())