const User = require('../User');

class PartyJoinRequestApproved {

  constructor(communicator, data) {
    
    this.communicator = communicator;

    this.sender = new User(this.communicator.getClient(), data);

    this.partyId = data.partyId;
    this.partyTypeId = data.partyTypeId;
    this.accessKey = data.accessKey;

    this.presencePermissions = data.presencePermissions;
    this.invitePermissions = data.invitePermissions;
    this.partyFlags = data.partyFlags;
    this.notAcceptingMemberReason = data.notAcceptingMemberReason;
    this.maxMembers = data.maxMembers;
    this.password = data.password;

    this.members = data.members.map((member) => {

      const accountId = member.userId || member.id || member.accountId;

      return new User(this.communicator.getClient(), {
        accountId,
        displayName: member.displayName || member.displayName,
        jid: this.communicator.makeJID(`${accountId}@prod.ol.epicgames.com/${member.xmppResource}`),
      });
    });
    
    this.time = data.time;
    
  }

  send(to) {

    return this.communicator.sendRequest({

      to,

      body: JSON.stringify({

        type: 'com.epicgames.party.joinrequest.approved',

        payload: {
          partyId: this.partyId,
          partyTypeId: this.partyTypeId,
          accessKey: this.accessKey,
          presencePermissions: this.presencePermissions,
          invitePermissions: this.invitePermissions,
          partyFlags: this.partyFlags,
          notAcceptingMembersReason: this.notAcceptingMemberReason,
          maxMembers: this.maxMembers,
          password: this.password,
          members: this.members.map(member => ({
            userId: member.id,
            displayName: member.displayName,
            xmppResource: member.jid.resource,
          })),
        },

        timestamp: new Date(),

      }),

    });

  }

}

module.exports = PartyJoinRequestApproved;
