import { ContentField } from '@structures/UI'

export const PasswordContentField = () => {
  return new ContentField({
    name: 'Password',
    key: 'password',
    description: 'Insira sua senha',
    filter: async (message) => {
      const { length } = message.content

      if (length < 3 || length > 64) {
        return 'Precisa ter mais que 3 e menos que 64 caracteres!'
      }

      return true
    },
    contentResolver: async (message) => '*'.repeat(message.content.length),
    valueResolver: async (message) => message.content,
    options: {
      removeIncorrectAnswers: true,
      removeCorrectAnswers: true,
      removeAllAnswers: true
    }
  })
}