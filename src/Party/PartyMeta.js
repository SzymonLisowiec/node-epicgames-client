const Meta = require('./Meta');

class PartyMeta extends Meta {

  constructor(party, meta) {
    super();

    this.party = party;
    this.app = this.party.app;
    
    this.lastPushedSchema = {};
    this.schema = {};

    if (meta) this.update(meta, true);

  }

  async setPrivacy(privacy) {
    const updated = {};
    const deleted = [];
    
    const privacySettings = this.get('PrivacySettings_j');
    if (privacySettings) {
      updated.PrivacySettings_j = this.set('PrivacySettings_j', {
        PrivacySettings: {
          ...privacySettings.PrivacySettings,
          partyType: privacy.partyType,
          bOnlyLeaderFriendsCanJoin: privacy.onlyLeaderFriendsCanJoin,
          partyInviteRestriction: privacy.inviteRestriction,
        },
      });
    }

    updated['urn:epic:cfg:presence-perm_s'] = this.set('urn:epic:cfg:presence-perm_s', privacy.presencePermission);
    updated['urn:epic:cfg:accepting-members_b'] = this.set('urn:epic:cfg:accepting-members_b', privacy.acceptingMembers);
    updated['urn:epic:cfg:invite-perm_s'] = this.set('urn:epic:cfg:invite-perm_s', privacy.invitePermission);

    if (['Public', 'FriendsOnly'].indexOf(privacy.partyType) > -1) deleted.push('urn:epic:cfg:not-accepting-members');

    if (privacy.partyType === 'Private') {
      updated['urn:epic:cfg:not-accepting-members-reason_i'] = 7;
    } else deleted.push('urn:epic:cfg:not-accepting-members-reason_i');

    await this.party.patch(updated, deleted);
  }
  
}

module.exports = PartyMeta;
