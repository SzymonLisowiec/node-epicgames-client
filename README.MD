# node-epicgames-client
The javascript client for EpicGames Launcher.

# Installation
```
npm i epicgames-client
```

# Example
```javascript
const EGClient = require('epicgames-client').Client;

let eg = new EGClient({
    email: 'EMAIL',
    password: 'PASSWORD'
});

eg.init().then(async (success) => {
	
	if(success){
		
		if(await eg.login()){
			
			let account = await eg.lookup('Kysune');
			
			if(account){
			
				console.log(account.displayName + '\'s id: ' + account.id);
				//It will return "Kysune's id: 9a1d43b1d826420e9fa393a79b74b2ff"
				
			}
		
		}
	
	}
	
});
```

# Methods

## init()
> Initialize client

## login()
> Login to an account.

## isID(value)
> Checks if `value` is account's id.
* __value__ {_string_}

## isDisplayName(value)
> Checks if `value` is account's display name.
* __value__ {_string_}

## getEpicDomains()
> Returns array of domains using by EpicGames.

## getLauncherStatus()
> Returns "DEPRECATED" or "NOT_DEPRECATED"

## getLauncherInfo()
> Returns object with informations about the current client (build etc.).

## lookup(display_name)
> Returns account's id, display name and extarnalAuths or `false` if user not found.
* __display_name__ {_string_} - user's display name

## getFriends()
> Returns array of your friends.
* __include_pending__ {_boolean_} - whether including pending friends (invite requests).

## getFriendsBlocklist()
> Returns array of your blacklisted friends.

## blockFriend(id)
> Blocking a friend. Returns `true` of `false` depending on whether the operation was successful.
* __id__ {_string_} - user's display name or id

## removeFriend(id)
> Removing a friend. Returns `true` of `false` depending on whether the operation was successful.
* __id__ {_string_} - user's display name or id

## inviteFriend(id)
> Sending a friend invite request. Returns `true` of `false` depending on whether the operation was successful.
* __id__ {_string_} - user's display name or id

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