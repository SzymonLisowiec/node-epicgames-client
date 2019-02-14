
# node-epicgames-client
### Unofficial EpicGames Launcher in javascript.
[![npm version](https://img.shields.io/npm/v/epicgames-client.svg)](https://npmjs.com/package/epicgames-client)
[![npm downloads](https://img.shields.io/npm/dm/epicgames-client.svg)](https://npmjs.com/package/epicgames-client)
[![license](https://img.shields.io/npm/l/epicgames-client.svg)](https://github.com/SzymonLisowiec/node-epicgames-client/blob/master/LICENSE.MD)
[![paypal](https://img.shields.io/badge/paypal-donate-orange.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=FDN57KFYRP4CQ&source=url)

__This library supports only epicgames launcher. If you need fortnite client, check [`node-epicgames-fortnite-client`](https://github.com/SzymonLisowiec/node-epicgames-fortnite-client)__

# Installation
```
npm i epicgames-client --save
```

# Example
```javascript
const { Client } = require('epicgames-client');

let client = new Client({
    email: 'EMAIL',
    password: 'PASSWORD'
});

(async _ => {

	if(!await client.init() || !await client.login())
		throw 'Error while initialize or login process.';
	
	let account = await client.lookup('Kysune');
			
	if(!account){
		console.log('Cannot found player.');
		return;
	}
			
	console.log(account.account_name + '\'s id: ' + account.id);
	//It will return "Kysune's id: 9a1d43b1d826420e9fa393a79b74b2ff"

})();
```

# TODO
- [x] Better documentation
- [ ] Code refactoring
- [ ] Support for in-lobby communication
- [ ] Implement support for all endpoints
- [ ] Better OOP

# Documentation (in progress)
- [Home](https://github.com/SzymonLisowiec/node-epicgames-client/wiki)
- [Client](https://github.com/SzymonLisowiec/node-epicgames-client/wiki/Client)
- [Communicator](https://github.com/SzymonLisowiec/node-epicgames-client/wiki/Communicator)
- [User](https://github.com/SzymonLisowiec/node-epicgames-client/wiki/User)
- [Friend](https://github.com/SzymonLisowiec/node-epicgames-client/wiki/Friend)
- [FriendRequest](https://github.com/SzymonLisowiec/node-epicgames-client/wiki/FriendRequest)
- [Communicator\Status](https://github.com/SzymonLisowiec/node-epicgames-client/wiki/Communicator%5CStatus)
- [Communicator\FriendMessage](https://github.com/SzymonLisowiec/node-epicgames-client/wiki/Communicator%5CFriendMessage)
- [Communicator\Party](https://github.com/SzymonLisowiec/node-epicgames-client/wiki/Communicator%5CParty)
- [Communicator\PartyData](https://github.com/SzymonLisowiec/node-epicgames-client/wiki/Communicator%5CPartyData)
- [Communicator\PartyMemberData](https://github.com/SzymonLisowiec/node-epicgames-client/wiki/Communicator%5CPartyMemberData)
- [Communicator\PartyInvitation](https://github.com/SzymonLisowiec/node-epicgames-client/wiki/Communicator%5CPartyInvitation)

# Do you need help?
Check our discord server: https://discord.gg/HxGfuEx

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
