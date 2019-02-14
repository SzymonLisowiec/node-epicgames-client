const User = require('../User');
const PartyMemberData = require('./PartyMemberData');

class PartyMember extends User {

  constructor(communicator, party, data) {
    super(communicator.getClient(), data);

    this.party = party;
    this.communicator = communicator;
    
    this.data = data.memberData || new PartyMemberData(this.communicator, {
      ...data,
      partyId: this.party.id,
    });
    
  }

  async setReady(isReady) {
    return this.data.setReady(isReady, this.party.members.map(member => member.jid));
  }

  async setBRCharacter(asset) {
    return this.data.setBRCharacter(asset, this.party.members.map(member => member.jid));
  }

  async setBRBanner(id, color, seasonLevel) {
    return this.data.setBRBanner(
      id, color, seasonLevel,
      this.party.members.map(member => member.jid),
    );
  }

  async setInputType(inputType) {
    return this.data.setInputType(inputType, this.party.members.map(member => member.jid));
  }

  async setBattlePass(show, passLevel, selfBoostXp, friendBoostXp) {
    return this.data.setBattlePass(
      show, passLevel, selfBoostXp, friendBoostXp,
      this.party.members.map(member => member.jid),
    );
  }

  async setEmote(asset) {
    return this.data.setEmote(asset, this.party.members.map(member => member.jid));
  }

  async clearEmote() {
    return this.data.clearEmote(this.party.members.map(member => member.jid));
  }

}

module.exports = PartyMember;
