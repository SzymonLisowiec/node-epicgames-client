# Account

## Example
```javascript
const { Launcher } = require('epicgames-client');

const launcher = new Launcher({
  email: 'E-MAIL',
  password: 'PASSWORD',
});

(async () => {

  if(!await launcher.init() || !await launcher.login()) {
    throw new Error('Error while initialize or login process.');
  }
	
  console.log(`Logged account's id: ${launcher.account.id}`);

})();
```

## Properties

### id
### name
### firstName
### lastName
### email
### failedLoginAttempts
### lastLogin
### numberOfDisplayNameChanges
### ageGroup
### headless
### country
### preferredLanguage