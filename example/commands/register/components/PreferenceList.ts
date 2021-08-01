import { ListField } from '../../../../src'

export const PreferencesList = () => new ListField({
  amount: {
    moreThan: 1 
  },
  description: 'Qual suas preferências?',
  key: 'preferences',
  name: 'Preferências',
  list: {
    '🤓': 'nerd',
    '🐒': {
      name: 'Macacos Não-Albinos',
      key: 'monkey'
    },
    // '🤣': 'pimpolho'
  }
})