import { ContentField } from '../../../../../src'

export const usernameContentField = () => new ContentField({
  name: 'Username',
  key: 'username',
  description: 'Qual seu nome de usuário?',
  required: true,
  filter: async (msg) => {
    if (msg.content.length < 6) return 'Precisa ser maior que 6'
    if (msg.content.length > 64) return 'Precisa ser menor que 64'
    return true
  },
  contentResolver: async (message) => message.content,
  valueResolver: async (message) => message.content,
  options: {
    removeAnswers: true
  }
})