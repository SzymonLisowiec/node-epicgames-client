const User = require('../User');

class PartyMemberPromoted {

  constructor(communicator, data) {
    
    this.communicator = communicator;

    this.sender = new User(this.communicator.getClient(), data);

    this.partyId = data.partyId;

    this.member = new User(this.communicator.getClient(), data.member);
    this.leaderLeaving = data.leaderLeaving;
    
    this.time = data.time;
    
  }

  send(to) {

    return this.communicator.sendRequest({

      to,

      body: JSON.stringify({

        type: 'com.epicgames.party.memberpromoted',

        payload: {
          partyId: this.partyId,
          promotedMemberUserId: this.member.id,
          fromLeaderLeaving: this.leaderLeaving,
        },

        timestamp: new Date(),

      }),

    });

  }

}

module.exports = PartyMemberPromoted;
