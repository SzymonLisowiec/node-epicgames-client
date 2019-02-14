const User = require('../User');

class PartyUpdateConfirmation {

  constructor(communicator, data) {
    
    this.communicator = communicator;

    this.sender = new User(this.communicator.getClient(), data);

    this.partyId = data.partyId;
    this.accessKey = data.accessKey;

    this.presencePermissions = data.presencePermissions;
    this.invitePermissions = data.invitePermissions;
    this.partyFlags = data.partyFlags;
    this.notAcceptingMemberReason = data.notAcceptingMemberReason;
    this.maxMembers = data.maxMembers;
    this.password = data.password;
    
    this.time = data.time;
    
  }

  async send(to) {

    return this.communicator.sendRequest({

      to,

      body: JSON.stringify({

        type: 'com.epicgames.party.updatepartyconfiguration',

        payload: {
          partyId: this.partyId,
          accessKey: this.accessKey,
          presencePermissions: this.presencePermissions,
          invitePermissions: this.invitePermissions,
          partyFlags: this.partyFlags,
          notAcceptingMembersReason: this.notAcceptingMemberReason,
          maxMembers: this.maxMembers,
          password: this.password,
        },

        timestamp: new Date(),

      }),

    });
    
  }

}

module.exports = PartyUpdateConfirmation;
