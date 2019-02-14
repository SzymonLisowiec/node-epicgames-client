const User = require('../User');

class PartyQueryJoinability {

  constructor(communicator, data) {
    
    this.communicator = communicator;

    this.sender = new User(this.communicator.getClient(), data);

    this.partyId = data.partyId;
    this.accessKey = data.accessKey;

    this.appId = data.appId;
    this.buildId = data.buildId;

    this.joinData = data.joinData;
    
    this.time = data.time;
    
  }

  send(to) {

    return this.communicator.sendRequest({

      to,

      body: JSON.stringify({

        type: 'com.epicgames.party.queryjoinability',

        payload: {
          partyId: this.partyId,
          accessKey: this.accessKey,
          appid: this.appId,
          buildid: this.buildId,
          joinData: this.joinData,
        },

        timestamp: new Date(),

      }),

    });

  }

}

module.exports = PartyQueryJoinability;
