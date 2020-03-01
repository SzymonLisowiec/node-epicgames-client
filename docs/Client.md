---
sidebarDepth: 2
---

# Client

## Options

### email
- **Type:** `string`
- **Default:** `null`

Also you can set this while using `login()` method.
### password
- **Type:** `string`
- **Default:** `null`

Also you can set this while using `login()` method.
### debug
If you need debug bot to console/file set to logging function. Simple you can use `console.log`. Disabled as default.
- **Type:** `function`
- **Default:** `null`
### useWaitingRoom
Set to `false` if you want to ignore the waiting room (EpicGames's load balancer).
- **Type:** `boolean`
- **Default:** `true`
### useCommunicator
Set to `false` if you don't want XMPP features (messaging with friends, parties/lobby system etc).
- **Type:** `boolean`
- **Default:** `true`
### partyMemberConfirmation
If you are the party leader, while someone joining, you have to confirm it. Defaulty library confirms all joining requests. If you want manualy decide about user join. You should set this property to `false` (and listening communicator's event `party:member:confirmation`) or `function` (example below).
- **Type:** `boolean|function`
- **Default:** `true`
```javascript
// Example of `partyMemberConfirmation` function
function (confirmation) {
  if (blacklist.indexOf(confirmation.member.id) === -1) {
    confirmation.confirm();
  } else {
    confirmation.reject();
  }
}
```

### platform
Object with keys `full`, `short` and `os`.
```javascript
// Default:
{
  full: 'Windows',
  short: EPlatform.WIN,
  os: 'Windows/10.0.17134.1.768.64bit',
}
```

### build
Copied from official launcher's logs. You can found it under name "Build". Defaultly is set on version which was live while library update.

### engineBuild
Copied from official launcher's logs. You can found it under name "Engine Build". Defaultly is set on version which was live while library update.

### netCL
Copied from official launcher's logs. You can found it under name "Net CL". Defaultly is set on version which was live while library update.

### http
`epicgames-client` using [request](https://github.com/request/request) library to sending request. You can set options for this library in this property.
- **Type:** `object`
- **Default:** `{}`

### language
Client's language.
- **Type:** `string`
- **Default:** `en-EN`

### createPartyOnStart
Set to `false` if you don't want join to party after login.
- **Type:** `boolean`
- **Default:** `true`

### defaultPartyConfig
- **Type:** `object`
- **Default:**
```javascript
{
  privacy: EPartyPrivacy.PUBLIC,
  joinConfirmation: false,
  joinability: 'OPEN',
  maxSize: 16,
  subType: 'default',
  type: 'default',
  inviteTTL: 14400,
  chatEnabled: true,
}
```

### autoPresenceUpdating
Set to `false` if you want set our custom status e.g. "Hello Wolrd.". Defautly is `true` and bot updating status as real user.
- **Type:** `boolean`
- **Default:** `true`

## Properties

### id
Equals `Launcher`.

### account
[Account object](./Account.html)

### communicator
[Communicator object](./Communicator.html)

### communicatorFriends
List of [Friend](./Friend.html) received from XMPP.

### entitlements
Account's entitlements.

### os
Launcher's OS.

### build
Launcher's build.

### UEBuild
Unreal Engine's build.

### http
Instance of [request](https://github.com/request/request) contains user's cookies. You can use this property to send requests on behalf your account.

## Methods

### setLanguage(language)
- **Arguments**
  - **language**  - string, e.g. `en`, `en-US`

### login(options)
- **Arguments**
  - **options**
    - **email** - defaultly [e-mail from instance options](#email)
    - **password** - defaultly [password from instance options](#password)
    - **twoFactorCode** - code from authenticatior while two factor authentication is enabled on your account
    - **captcha** - function, see example below
- **Returns:** `boolean`
```javascript
await client.login({
  email: 'user@example.com',
  password: 'str0ngp4ssw0rd',
  captcha: async (reputation, captchaData, meta) => {
    return thirdPartyResolver('funcaptcha', {
      // ...
    });
  },
});
```

### register(options)
- **Arguments**
  - **options**
    - **country** - string, e.g. `US`, `PL`
    - **firstName**
    - **lastName**
    - **displayName**
    - **email**
    - **password**
    - **recaptchaResponse**
- **Returns:** `boolean`

### logout()
- **Returns:** `boolean`

### isID(id)
Checks if passed id is valid account's id.
- **Arguments**
  - **id** - string
- **Returns:** `boolean`

### isDisplayName(name)
Checks if passed name is valid account's display name.
- **Arguments**
  - **name** - string
- **Returns:** `boolean`

### getEpicDomains()
- **Returns:** `array` of epicgames friendly domains

### lookup(name)
Lookups user.
- **Arguments**
  - **name** - string
- **Returns:** `object` or `false` while failure
```javascript
{
  id: '91a0a53b14c6418183a9e61ccb7b04af',
  name: 'Kysune',
  externalAuths: {},
}
```

### findActiveEntitlementByName(name)
Searchs entitlement in your entitlements.
- **Arguments**
  - **name** - string, entitlement's name
- **Returns:** `object` or `undefined`

### getEntitlements()
Fetchs your account's entitlements.
- **Returns:** `array` of entitlements or `false`

### getOffersForNamespace(namespace, count, start)
Fetchs all offers for given namespace.
- **Arguments**
  - **namespace** - string, e.g. `fn` for Fortnite or `epic` for EpicGames Store
  - **count** - number
  - **start** - number
- **Returns:** `array` of offers or `false`

### quickPurchase(offer, quantity)
- **Arguments**
  - **offer** - object
    - **id** - string, offer's id
    - **namespace** - string, offer's namespace
  - **quantity** - number
- **Returns:** `boolean`

### getProfile(id)
Same as [lookup(name)](#lookup-name), but you can search by id or name.
- **Arguments**
  - **id** - string, account's id or name.

### getProfiles(ids)
Same as [getProfile(id)](#getprofile-id)
- **Arguments**
  - **id** - array of string - account's ids or names.

### getFriends()
- **Returns:** `array` of [Friend](./Friend.html)

### getFriendRequests()
- **Returns:** `array` of [FriendRequest](./FriendRequest.html)

### hasFriend(id)
- **Arguments**
  - **id** - string, account's id or name.
- **Returns:** `boolean`

### getFriendsBlocklist()
Same as [getFriends](#getfriends), but returns only blocked friends.

### blockFriend(id)
- **Arguments**
  - **id** - string, account's id or name.
- **Returns:** [Friend](./Friend.html) or `false` on failure

### removeFriend(id)
- **Arguments**
  - **id** - string, account's id or name.
- **Returns:** [Friend](./Friend.html) or `false` on failure

### inviteFriend(id)
- **Arguments**
  - **id** - string, account's id or name.
- **Returns:** [Friend](./Friend.html) or `false` on failure

### getFriendStatus(id)
- **Arguments:**
  - **id** - string, account's id or name.
- **Returns:** [Status](./Status.html)

### acceptFriendRequest(id)
Same as [inviteFriend(id)](#invitefriend-id).

### declineFriendRequest(id)
Same as [removeFriend(id)](#removefriend-id).

### runGame(app, options)
Runs application (sub-libraries). Look example below.
- **Arguments**
  - **app** - app library e.g. [`epicgames-fortnite-client`](https://npmjs.com/epicgames-fortnite-client)
  - **options** - object, depends on `app`
- **Returns:** app's instance
```javascript
const Fortnite = require('epicgames-fortnite-client');
const app = await launcher.runGame(Fortnite);
console.log(`Your vbucks: ${app.vbucks}`);
```

### resendEmailVerification()
Resends e-mail with verification link.
- **Returns:** `boolean`

### enableTwoFactor(type, twoFactorCode)
Enables two factor authentication.
- **Arguments**
  - **type** - string, `authenticator` or `email`
  - **twoFactorCode** - string, number or function, see example below
- **Returns:** `object` with `otpauth` and `secret`
```javascript
await launcher.enableTwoFactor('authenticator', (secret) => {
  return require('authenticator').generateToken(secret); // https://www.npmjs.com/package/authenticator
});
```

### disableTwoFactor(type)
Disables two factor authentication.
- **Arguments**
  - **type** - string, `authenticator` or `email`
- **Returns:** `boolean`

### checkEULA(namespace)
### acceptEULA(eula)
