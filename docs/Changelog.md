# Changelog

## 2.0.17
- Improved [`Party`](/Party.html) and [`PartyMember`](/PartyMember.html) obejcts.

## 2.0.16
- Added filter argument for [`waitForEvent()`](/Communicator.html#waitforevent-event-timeout) method.
- Improved [`getFriendStatus(id)`](/Client.html#getfriendstatus-id) method.

## 2.0.15
- Added temporary solution for problem with accepting invitations (in few cases). Thanks [Terbau](https://github.com/Terbau) for [PR](https://github.com/SzymonLisowiec/node-epicgames-client/pull/52).
- Added [`waitForEvent()`](/Communicator.html#waitforevent-event-timeout) method to `Communicator`. Thanks [Terbau](https://github.com/Terbau) for [PR](https://github.com/SzymonLisowiec/node-epicgames-client/pull/52).
- Added `getFriendStatus(id)` method for `Launcher` (`Client`). Thanks [Terbau](https://github.com/Terbau) for [PR](https://github.com/SzymonLisowiec/node-epicgames-client/pull/52).
- Added Nintendo Switch to platform's enumerator (`EPlatform`).
- Added communicator's events:
  - `friend#ID:request`
  - `friend#ID:added`
  - `friend#ID:removed`
  - `friend#ID:status`
  - `friend#ID:message`
- Updated launcher's `netCL`, `build` and `engineBuild`.

## 2.0.14
- Updated `enableTwoFactor()` and `disableTwoFactor()` methods.

## 2.0.13
- Added possibility to fetch more than 100 profiles through `getProfiles()` method. Thanks [iXyles](https://github.com/iXyles) for [PR](https://github.com/SzymonLisowiec/node-epicgames-client/pull/47).
- You can accept/reject invitation to the party from now on.
- Fixed error `errors.com.epicgames.social.party.party_not_found` while joining to private party.
- Improved updating local the party's privacy state. If you invite bot to private lobby, and leave him alone, bot will understand the party's privacy and you can't join to him without invite.
- Improved updating account's presence according to him the party's state.
- Other fixes

## 2.0.12
- Fixed error `user_has_party`.
- Integration with new Fortnite update.
- Some fixes

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