---
home: false
footer: MIT Licensed | Copyright © 2019-present Szymon Lisowiec
---

::: warning
Documentation is in progress. :)
:::

# Home

## Installation
```bash
npm i epicgames-client --save
```

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
  
  const playerName = 'Kysune';
  const account = await launcher.getProfile(playerName);
  if(!account) throw new Error(`Player ${playerName} not found!`);
	
  console.log(`${account.name}'s id: ${account.id}`);
  // "Kysune's id: 9a1d43b1d826420e9fa393a79b74b2ff"

})();
```

## Do you need help?
Check our discord server: [https://discord.gg/HxGfuEx](https://discord.gg/HxGfuEx)

## License
MIT License

Copyright (c) 2018 Szymon Lisowiec

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.