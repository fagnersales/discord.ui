import { ListField } from '../../../../src'

export const GenderList = () => new ListField({
  amount: {
    specified: 1
  },
  description: 'Qual seu gênero? (Selecione 1)',
  key: 'gender',
  name: 'Gênero',
  required: false,
  list: {
    '🤓': {
      key: 'nerd',
      name: 'Nerd',
      description: 'usuarios de oculos'
    },
    '🐒': {
      key: 'monkey',
      name: 'macaco',
      description: 'fãs do muca'
    },
  }
})