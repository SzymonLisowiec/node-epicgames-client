---
sidebarDepth: 2
---

# Party

## Example
```javascript
const { Launcher } = require('epicgames-client');
const Fortnite = require('epicgames-fortnite-client');

const launcher = new Launcher({
  email: 'E-MAIL',
  password: 'PASSWORD',
});

(async () => {

  if(!await launcher.init() || !await launcher.login()) {
    throw new Error('Error while initialize or login process.');
  }
	
  const app = await launcher.runGame(Fortnite);

  await app.party.setCustomMatchKey('xyz');

})();
```

## Properties

### id
The party's id.

### me
Your `Member` object.

### leader
Leader's `Member` object.

## Methods

### leave()
Leaves the party.

### setCustomMatchKey(key) // only in `epicgames-fortnite-client`
- **Arguments**
  - **key** - string, custom match key

### setAllowJoinInProgress(allow) // only in `epicgames-fortnite-client`
- **Arguments**
  - **allow** - boolean

### static::lookup(app, id)
Lookups party by id.
- **Arguments**
  - **app** - `Application` object, e.g. `epicgames-fortnite-client`
  - **id** - party's id to lookup
- **Returns:** `Party` object

### static::create(app, config)
Opens new party.
- **Arguments**
  - **app** - `Application` object, e.g. `epicgames-fortnite-client`
  - **config** - party's configuration
- **Returns:** `Party` object