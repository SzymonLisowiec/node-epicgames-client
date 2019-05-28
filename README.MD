
# Unofficial EpicGames Client for Node.js
[![npm version](https://img.shields.io/npm/v/epicgames-client.svg)](https://npmjs.com/package/epicgames-client)
[![npm downloads](https://img.shields.io/npm/dm/epicgames-client.svg)](https://npmjs.com/package/epicgames-client)
[![license](https://img.shields.io/npm/l/epicgames-client.svg)](https://github.com/SzymonLisowiec/node-epicgames-client/blob/master/LICENSE.MD)
[![patreon](https://img.shields.io/badge/patreon-donate-orange.svg)](https://www.patreon.com/kysune)

__This library supports only epicgames launcher. If you need fortnite client, check [`node-epicgames-fortnite-client`](https://github.com/SzymonLisowiec/node-epicgames-fortnite-client)__

# Installation
```
npm i epicgames-client --save
```

# Example
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

# Documentation
[CLICK](https://epicgames-client.kysune.me/)

# TODO
- [x] Better documentation
- [x] Code refactoring
- [ ] More code refactoring
- [ ] Support for in-lobby communication
- [ ] Implement support for all endpoints

# Do you need help?
Check our discord server: https://discord.gg/HxGfuEx

# Support
If you would my private help with use of my libraries, or just support me, [click here](https://www.patreon.com/kysune).
I would be grateful for github stars. :)

# License
MIT License

Copyright (c) 2018 Kysune

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
