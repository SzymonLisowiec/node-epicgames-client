const User = require('../User');

class PartyMemberExited {

  constructor(communicator, data) {
    
    this.communicator = communicator;

    this.sender = new User(this.communicator.getClient(), data);

    this.partyId = data.partyId;

    this.member = new User(this.communicator.getClient(), data.memberId);
    this.wasKicked = data.wasKicked;
    
    this.time = data.time;
    
  }

  send(to) {

    return this.communicator.sendRequest({

      to,

      body: JSON.stringify({

        type: 'com.epicgames.party.memberexited',

        payload: {
          partyId: this.partyId,
          memberId: this.member.id,
          wasKicked: this.wasKicked,
        },

        timestamp: new Date(),

      }),

    });

  }

}

module.exports = PartyMemberExited;
