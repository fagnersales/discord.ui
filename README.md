O objetivo desta library é permitir que haja uma interface simples e direta entre o programador e o usuário, podendo criar formulários com botões que extendem para outras áreas e por aí vai.

### Example for creating a Login Form (username, password)

#### Imports
```typescript
import { UI, ContentField } from 'discord-ui'
```

#### Creating a ContentField for Username Input 
```typescript
const usernameContentField = () => new ContentField({
  name: 'Username',
  description: 'What is your username?',
  key: 'username',
  required: true,
  filter: async (message) => {
    const { length } = message.content

    if (length < 6) return 'Must be higher than 6 in length'
    if (length > 64) return 'Must be less than 64 in length'

    return true
  },
  contentResolver: async (message) => message.content,
  valueResolver: async (message) => message.content
})
```
#### Creating a ContentField for Password Input 
```typescript
const passwordContentField = () => new ContentField({
  name: 'Password',
  description: 'What is your password?',
  key: 'password',
  required: true,
  filter: async (message) => {
    if (message.content.includes(' ')) return 'Password can not have spaces'

    const { length } = message.content

    if (length < 6) return 'Must be higher than 6 in length'
    if (length > 64) return 'Must be less than 64 in length'

    return true
  },
  contentResolver: async (message) => '*'.repeat(message.content.length),
  valueResolver: async (message) => message.content
})
```

#### Using the UI to handle the form
```typescript
client.on('message', message => {
  if (message.content.startsWith('!login')) {

    const loginUI = new UI({
      components: [
        usernameContentField(),
        passwordContentField()
      ] 
    })

    await loginUI.setup({
      channel: message.channel,
      user: message.author
    })
    
    if (loginUI.completed) {
      const { username, password } = loginUI.getContentFieldsResult()

      console.log(`Username: ${username} | Password: ${password}`)
    }
  }
})
```