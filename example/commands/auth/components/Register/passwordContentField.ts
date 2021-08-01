import { ContentField } from '../../../../../src'

export const passwordContentField = () => new ContentField({
  key: 'password',
  name: 'Password',
  description: 'Qual sua senha?',
  required: true,
  filter: async (message) => {
    const { length } = message.content
    
    if (length < 6) return 'Precisa ser maior que 6'
    if (length > 64) return 'Precisa ser menor que 64'

    return true
  },
  contentResolver: async (message) => '*'.repeat(message.content.length),
  valueResolver: async (message) => message.content
})