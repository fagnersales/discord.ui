import { ContentField } from '../../../../../src'

export const confirmPasswordContentField = (passwordContentField: ContentField) => new ContentField({
  key: 'confirmPassword',
  name: 'Confirm Password',
  description: 'Insira sua senha novamente',
  required: true,
  filter: async (message) => {
    if (message.content !== passwordContentField.value) return 'As senhas precisam ser idênticas'

    return true
  },
  contentResolver: async (message) => '*'.repeat(message.content.length),
  valueResolver: async (message) => message.content
})