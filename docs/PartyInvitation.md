---
sidebarDepth: 2
---

# PartyInvitaton

## Example
```javascript
app.communicator.on('party:invitation', async (invitation) => {
  await invitation.accept();
});
```

## Methods

### accept()
Accepts invitation to the party.

### reject()
Rejects invitation to the party.

### static::send(party, accountId)
- **Arguments**
  - **party** - [Party](/Party.html), You can use `app.party` to invite someone to your currently party.
  - **accountId** - the invited account's id