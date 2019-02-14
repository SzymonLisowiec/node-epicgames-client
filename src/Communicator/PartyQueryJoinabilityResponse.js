const User = require('../User');

class PartyQueryJoinabilityResponse {

  constructor(communicator, data) {
    
    this.communicator = communicator;

    this.sender = new User(this.communicator.getClient(), data);

    this.partyId = data.partyId;
    this.isJoinable = data.isJoinable;

    this.rejectionType = data.rejectionRype;
    this.resultParam = data.resultParam;
    
    this.time = data.time;
    
  }

  send(to) {

    return this.communicator.sendRequest({

      to,

      body: JSON.stringify({

        type: 'com.epicgames.party.queryjoinability.response',

        payload: {
          partyId: this.partyId,
          isJoinable: this.isJoinable,
          rejectionType: this.rejectionType,
          resultParam: this.resultParam,
        },

        timestamp: new Date(),

      }),

    });

  }

}

module.exports = PartyQueryJoinabilityResponse;
