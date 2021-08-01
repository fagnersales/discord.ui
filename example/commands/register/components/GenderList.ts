import { ListField } from '../../../../src'

export const GenderList = () => new ListField({
  amount: {
    specified: 1
  },
  description: 'Qual seu gênero?',
  key: 'gender',
  name: 'Gênero',
  required: false,
  list: {
    '🤓': 'sou nerd',
    // '🐒': 'macaco',
    // '🤣': 'pimpolho',
    // '🐝': 'outro'
  }
})