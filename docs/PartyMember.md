---
sidebarDepth: 2
---

# PartyMember

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

  await app.party.me.setReady(true);

})();
```

## Properties

### id
The member's account id.

### party
Member's `Party` object.

### connections
List of member connections (contains communicator jids).

### role
Member's role. In Fortnite, `CAPTAIN` is party leader.

### joinedAt

## Methods

### setReady(isReady) // only in `epicgames-fortnite-client`
- **Arguments**
  - **isReady** - boolean

### setInputType(inputType) // only in `epicgames-fortnite-client`
- **Arguments**
  - **inputType** - `EInputType`

### setPlatform(platform) // only in `epicgames-fortnite-client`
- **Arguments**
  - **platform** - `EPlatform`

### setEmote(asset) // only in `epicgames-fortnite-client`
- **Arguments**
  - **asset** - string

### clearEmote() // only in `epicgames-fortnite-client`

### setOutfit(asset) // only in `epicgames-fortnite-client`
- **Arguments**
  - **asset** - string

### setBackpack(asset) // only in `epicgames-fortnite-client`
- **Arguments**
  - **asset** - string

### setPickaxe(asset) // only in `epicgames-fortnite-client`
- **Arguments**
  - **asset** - string
  
### setBanner(level, icon, color) // only in `epicgames-fortnite-client`
- **Arguments**
  - **level** - number
  - **icon** - string
  - **color** - string

### setBattlePass(hasPuchased, level, selfBoostXp, friendBoostXp) // only in `epicgames-fortnite-client`
- **Arguments**
  - **hasPuchased** - boolean
  - **level** - number
  - **selfBoostXp** - number
  - **friendBoostXp** - number

### kick()

### promote()
Promote member to leader role.