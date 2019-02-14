const User = require('../User');

class PartyMemberJoined {

  constructor(communicator, data) {
    
    this.communicator = communicator;

    this.sender = new User(this.communicator.getClient(), data);

    this.partyId = data.partyId;

    const memberAccountId = data.member.userId || data.member.accountId;
    this.member = new User(this.communicator.getClient(), {
      accountId: memberAccountId,
      displayName: data.member.displayName || data.member.displayName,
      jid: this.communicator.makeJID(`${memberAccountId}@prod.ol.epicgames.com/${data.member.xmppResource}`),
    });
    
    this.time = data.time;
    
  }

  send(to) {

    return this.communicator.sendRequest({

      to,

      body: JSON.stringify({

        type: 'com.epicgames.party.memberjoined',

        payload: {
          partyId: this.partyId,
          member: {
            userId: this.member.id,
            displayName: this.member.displayName,
            xmppResource: this.member.jid.resource,
          },
        },

        timestamp: new Date(),

      }),

    });

  }

}

module.exports = PartyMemberJoined;
