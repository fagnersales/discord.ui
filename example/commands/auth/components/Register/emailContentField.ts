import { ContentField } from '../../../../../src'

export const emailContentField = () => new ContentField({
  key: 'email',
  name: 'Email',
  description: 'Qual seu email? (não fiz checagem)',
  required: true,
  filter: async (message) => {
    const { length } = message.content
    
    if (length < 6) return 'Precisa ser maior que 6'
    if (length > 64) return 'Precisa ser menor que 64'

    return true
  },
  contentResolver: async (message) => message.content,
  valueResolver: async (message) => message.content
})