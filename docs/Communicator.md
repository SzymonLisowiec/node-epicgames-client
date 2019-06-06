---
sidebarDepth: 2
---

# Communicator

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
	
  const friends = await launcher.getFriends();

  launcher.communicator.on('friend:message', async (friendMessage) => {
    const friend = friends.find(friend => friend.id === friendMessage.friend.id);
    console.log(friend.name + ': ' + friendMessage.message);
  });

})();
```

## Properties

## Methods

### sendMessage(id, message)
- **Arguments**
  - **id** - string, recipient's account id
  - **message** - string, your message

### updateStatus(status)
- **Arguments**
  - **status** - optional, `string`, `object` or `null`.

## Events

### raw:incoming
### raw:outgoing
### connected
### disconnected
### session:bound
### session:started
### session:ended
### friends
Emitted while login with friends list.
### friend:request
Emitted while you received friend request.
### friend:added
Emitted while you added a friend.
### friend:removed
Emitted while you removed a friend.
### friend:status
Emitted while your friend change status e.g. "Playing in Fortnite".
### friend:message
Emitted while your friend send message to you.
### party:updated
Emitted while leader change party state, it means change e.g. privacy, playlist.
```javascript
app.on('party:member:joined', (party) => {
  console.log(`Party#${party.id} updated!`);
});
```
### party:member:joined
Emitted while someone has joined to the party.
```javascript
app.on('party:member:joined', (member) => {
  console.log(`Member ${member.name} joined!`);
});
```
### party:member:left
Emitted while someone has left the party.
```javascript
app.on('party:member:left', (member) => {
  console.log(`Member ${member.name} left!`);
});
```
### party:member:expired
```javascript
app.on('party:member:expired', (member) => {
  console.log(`Member ${member.name} expired!`);
});
```
### party:member:promoted
Emitted while someone has been promoted to e.g. leader.
```javascript
app.on('party:member:promoted', (member) => {
  console.log(`Member ${member.name} has been promoted to ${member.role} role!`);
});
```
### party:member:kicked
Emitted while someone has been kicked from party.
```javascript
app.on('party:member:kicked', (member) => {
  console.log(`Member ${member.name} kicked!`);
});
```
### party:member:disconnected
### party:member:state:updated
Emitted while party member change their state, it means change e.g. outfit, backpack, emote, readiness.
### party:member:confirmation
Emitted while someone want join into your party. 
```javascript
app.on('party:member:confirmation', (confirmation) => {
  confirmation.confirm();
  // or
  confirmation.reject();
});
```
### party:invitation
Emitted while your account receive party invitation.
```javascript
app.on('party:invitation', (invitation) => {
  invitation.accept();
  // or
  invitation.decline();
});
```
### party:invitation:canceled
Emitted while sender canceled invitation.
### party:invitation:declined
Emitted while recipient declined invitation.