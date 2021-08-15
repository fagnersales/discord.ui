import { ContentField } from '@structures/UI'

export const UsernameContentField = () => {
  return new ContentField({
    name: 'Username',
    key: 'username',
    description: 'Insira seu nome de usuário',
    filter: async (message) => {
      const { length } = message.content

      if (length < 3 || length > 64) {
        return 'Precisa ter mais que 3 e menos que 64 caracteres!'
      }

      return true
    },
    contentResolver: async (message) => message.content,
    valueResolver: async (message) => message.content,
    options: {
      removeIncorrectAnswers: true,
      removeAllAnswers: true
    }
  })
}