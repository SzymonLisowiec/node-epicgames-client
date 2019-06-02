# Changelog

## 2.0.11
- Added enum `EPartyPrivacy`.
- Added `Client` options:
  - `createPartyOnStart` - boolean, set to `false` if you don't want join to party after login.
  - `autoPresenceUpdating` - boolean, set to `false` if you want set our custom status e.g. "Hello Wolrd.". Defautly is `true` and bot updating status as real user.
  - `defaultPartyConfig` - object, default state below.
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
- Added `Member.promote()` and `Party.promote(member)` methods. Thanks [iXyles](https://github.com/iXyles) for [PR](https://github.com/SzymonLisowiec/node-epicgames-client/pull/41).
- Added `setPrivacy(privacy)` method to `Party`. `privacy` argument is a `EPartyPrivacy`.
- Improved `Meta.get(key, raw)` method (added `raw` argument, set to `true` if you don't want parse a value).
- Added removing keys in `Meta`.
- Fixed removing users from `Party`.
- some fixes


## 2.0.10
- Added event `party:member:disconnected` for `Communicator`.

## 2.0.8
- Added kicking party members by `party.kick(accountId)` or `member.kick()`.
- Fixed error `errors.com.epicgames.social.party.stale_revision` while updating new party.
- `party.findMember()` currently searching by `accountId` and `PartyMember` object.
Thanks to: [iXyles](https://github.com/iXyles) 

## 2.0.7
- Fixed `Party` methods: `setCustomMatchKey(key)` and `setAllowJoinInProgress(canJoin)`. Thanks [iXyles](https://github.com/iXyles) for report.

## 2.0.6
- fixed `getFriends()` method. Thanks [iXyles](https://github.com/iXyles) for PR.
- removed `includePending` attribute from `getFriends()`. Currently you can get pending friends only by `getFriendRequests()` (previously `getPendingFriends()`).
- Added exit process handler for new feature in `epicgames-fortnite-client`.
- Improved checking EULA while running game by `runGame()` method.