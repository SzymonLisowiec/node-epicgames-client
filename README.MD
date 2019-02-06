
# node-epicgames-client
Unofficial EpicGames Launcher in javascript.

__This library supports only epicgames launcher. If you need fortnite client, check [`node-epicgames-fortnite-client`](https://github.com/SzymonLisowiec/node-epicgames-fortnite-client)__

# Installation
```
npm i epicgames-client --save
```

# Wiki in progress
[CLICK HERE](https://github.com/SzymonLisowiec/node-epicgames-client/wiki)

# Do you need help?
Check our discord server: https://discord.gg/HxGfuEx

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
			
				console.log(account.account_name + '\'s id: ' + account.id);
				//It will return "Kysune's id: 9a1d43b1d826420e9fa393a79b74b2ff"
				
			}
		
		}
	
	}
	
});
```

# Constructor options
```javascript
const EpicGamesClient = require('epicgames-client').Client;
let eg = new EpicGamesClient({

	email: '',
	password: '',

	debug: null, // if you need console/file output with logs. Simple you can use `console.log`
	use_waiting_room: true, // false to ignore waiting room (epicgames load balancer)

	http: {
		// settings for lib https://github.com/request/request
	},
	
	backward_compatibility: false // Set on true if you want old-style response in methods getFriends() and lookup()

});
```

# Properties

## build
> Desktop's launcher version

## ue_build
> Unreal Engine version

## app_name
> Launcher name

## label_name
> Launcher's platform

## account
> Object with informations about logged in account.

- __id__ - account's id
- __display_name__ - account's nickname
- __name__ - alias for `display_name`
- __first_name__
- __last_name__
- __email__
- __age_group__
- __country__
- __preferred_language__
- __last_login__
- __failed_login_attempts__

# Methods

## init()
> Initialize client

## login()
> Login to an account.

## logout()
> Kill account's session on epicgames servers.

## isID(value)
> Checks if `value` is account's id.
* __value__ {_string_}

## isDisplayName(value)
> Checks if `value` is account's display name.
* __value__ {_string_}

## getEpicDomains()
> Returns array of domains using by EpicGames.

## runGame(game, options)
> Returns game object or `false` if can't run game.
* __game__ {_object_} - game library, e.g. [epicgames-fortnite-client](https://github.com/SzymonLisowiec/node-epicgames-fortnite-client)
* __options__ {_object_} (optional) - game library constructor options

## setLanguage(iso_lang_code)
* __iso_lang_code__ {_string_} - e.g. `en`, `en-US`, `pl`, `pl-PL`

## getProfile(id_or_name)
> Returns `User` object or `false` if user not found.
* __id_or_name__ {_string_} - user's display name or id

## getProfiles(arr)
> Returns array of `User` objects.
* __arr__ {_array_} - Array with names or ids (can be mixed)

## lookup(display_name)
> Returns account's id, display name and extarnalAuths or `false` if user not found. I recommend use `getProfile` method.
* __display_name__ {_string_} - user's display name

## getFriends([include_pending=false])
> Returns array of your friends (`Friend` objects).
* __include_pending__ {_boolean_} (optional) - whether including pending friends (invite requests).

## getPendingFriends()
> Returns array of your pending friends.

## hasFriend(id_or_name)
> Verifying given account is your friend.
* __id_or_name__ {_string_} - user's display name or id

## getFriendsBlocklist()
> Returns array of your blacklisted friends.

## blockFriend(id_or_name)
> Blocking a friend. Returns `Friend` or `false` depending on whether the operation was successful.
* __id_or_name__ {_string_} - user's display name or id

## removeFriend(id_or_name)
> Removing a friend. Returns `Friend` or `false` depending on whether the operation was successful.
* __id_or_name__ {_string_} - user's display name or id

## inviteFriend(id_or_name)
> Sending a friend invite request. Returns `Friend` or `false` depending on whether the operation was successful.
* __id_or_name__ {_string_} - user's display name or id

## acceptFriendRequest(id_or_name)
> Accepting friend's invitation. Alias for method inviteFriend
* __id_or_name__ {_string_} - user's display name or id

## declineFriendRequest(id_or_name)
> Declining friend's invitation. Alias for method removeFriend
* __id_or_name__ {_string_} - user's display name or id

## ~~getLauncherInfo()~~ PROBABLY DEPRECATED
> Returns object with informations about the current client (build etc.).

## getLauncherStatus()
> Returns "DEPRECATED" or "NOT_DEPRECATED"

# Communicator

## Example of use
```javascript
const EGClient = require('epicgames-client').Client;

let eg = new EGClient({
    email: 'EMAIL',
    password: 'PASSWORD'
});

(async _ => {

	if(!await eg.init() || !await eg.login())
		throw 'Error while initialize or login process.';

	let communicator = eg.communicator;

	communicator.on('friend:message', async data => {
		let author = await eg.getProfile(data.account_id);
		console.log(author.display_name + ': ' + data.message);
	});

})();
```

## Methods

### sendMessage(id, message)
* __id__ {_string_} - user's id
* __message__ {_string_} - message

### updateStatus([status=null])
* __status__ {_string, object or null_} (optional) - status is displaying under name on friends list.

## Events

### disconnected
### session:started
### session:ended

### raw:incoming
Using for debugging, is emited while receiving every data.
### raw:outgoing
Using for debugging, is emited while sending every data

### friends
is emited after login
### friend:added
is emited while you added new friend and he accepted invitation (and vice versa).
**Returns *Friend* object.**
### friend:removed
is emited while your friend has been removed from friends list.
**Returns *Friend* object.**
### friend:status
is emited while your friend updated status.
### friend:request
is emited while someone invited you to friends.
**Returns *FriendRequest* object.**
### friend:message
is emited while your friend sent you a message.
**Returns *FriendMessage* object.**
### friend:party:invitation
is emited while your friend invite you to party.
### friend:party:join-request
is emited while your friend wants join to your party.


# User

## Properties

### id
> User's id

### display_name
> Display name visible in game and on friends list.

### external_auths
> User's third party accounts e.g. PSN

## Methods

### *static* get(client, id_or_name)

# Friend
> This object is extended by `User`.

## Properties

### status
> Friend status: UNDEFINED, PENDING, ACCEPTED, REMOVED, BLOCKED

### favorite
> Is favorite friend

### last_action_at
> Time of last action on this friend.

## Methods

### *static* invite(client, id_or_name)
> Sending invite to user.

### remove()
> Removes friend

# FriendRequest

## Properties

### friend
> `Friend` object

### direction
> INCOMING or OUTGOING

### status
> same as in `Friend`

### time
> Time of receive friend request

## Methods

### accept()

### reject()

# FriendMessage

## Properties

### friend
> `Friend` object

### message
> Received message

### time
> Time of receive message

## Methods

### reply(message)

# TODO
- [ ] Better reference API
- [ ] Few improves
- [ ] Implement support for all endpoints
- [ ] Better OOP

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
