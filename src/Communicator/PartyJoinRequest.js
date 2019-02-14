const User = require('../User');

class PartyJoinRequest {

  constructor(communicator, data) {
    
    this.communicator = communicator;

    this.sender = new User(this.communicator.getClient(), data);

    this.partyId = data.partyId;
    this.accessKey = data.accessKey;

    this.platform = data.platform || '';

    this.appId = data.appId;
    this.buildId = data.buildId;

    this.joinData = data.joinData || null;
    
    this.time = data.time;
    
  }

  send(to) {

    const payload = {
      partyId: this.partyId,
      accessKey: this.accessKey,
      displayName: this.sender.displayName,
      platform: this.platform,
      appid: this.appId,
      buildid: this.buildId,
    };

    if (this.joinData) payload.joinData = this.joinData;

    return this.communicator.sendRequest({

      to,

      body: JSON.stringify({

        type: 'com.epicgames.party.joinrequest',

        payload,

        timestamp: new Date(),

      }),

    });

  }

}

module.exports = PartyJoinRequest;
