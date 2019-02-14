const User = require('../User');

const PartyInvitationResponse = require('./PartyInvitationResponse');

class PartyInvitation {

  constructor(communicator, data) {
    
    this.communicator = communicator;
    this.client = this.communicator.getClient();
    
    this.sender = new User(this.communicator.getClient(), data);

    this.partyId = data.partyId;
    this.partyTypeId = data.partyTypeId;
    this.accessKey = data.accessKey;

    this.appId = data.appId;
    this.buildId = data.buildId;
    
    this.time = data.time;

    this.party = data.party;
    
  }

  send(to) {

    return this.communicator.sendRequest({

      to,

      body: JSON.stringify({

        type: 'com.epicgames.party.invitation',

        payload: {
          partyId: this.partyId,
          partyTypeId: this.partyTypeId,
          displayName: this.sender.displayName,
          accessKey: this.accessKey,
          appId: this.appId,
          buildId: this.buildId.toString(),
        },

        timestamp: new Date(),

      }),

    });

  }

  async accept() {
    if (this.sender.id === this.client.account.id) return;
    await this.party.askToJoin(this.sender.jid);
  }

  async reject() {
    
    const response = new PartyInvitationResponse(this.communicator, {
      accountId: this.client.account.id,
      displayName: this.client.account.displayName,
      partyId: this.partyId,
      response: 2,
    });

    return response.send(this.sender.jid);

  }

}

module.exports = PartyInvitation;
