const User = require('../User');
const PartyMemberPromoted = require('./PartyMemberPromoted');
const PartyMemberData = require('./PartyMemberData');

class PartyMember extends User {

  /**
   * @param {Communicator} communicator 
   * @param {Party} party 
   * @param {Object} data
   */
  constructor(communicator, party, data) {
    super(communicator.getClient(), data);

    this.party = party;
    this.communicator = communicator;
    this.client = this.communicator.getClient();
    
    this.data = data.memberData || new PartyMemberData(this.communicator, {
      ...data,
      partyId: this.party.id,
    });
    
  }

  /**
   * Set ready state.
   * @param {boolean} isReady
   */
  async setReady(isReady) {
    return this.data.setReady(isReady, this.party.members.map(member => member.jid));
  }

  /**
   * Change character's outfit.
   * @param {string} asset e.g. `/Game/Athena/Items/Cosmetics/Characters/CID_342_Athena_Commando_M_StreetRacerMetallic.CID_342_Athena_Commando_M_StreetRacerMetallic`
   */
  async setBRCharacter(asset) {
    return this.data.setBRCharacter(asset, this.party.members.map(member => member.jid));
  }

  /**
   * Change player's banner.
   * @param {string} id e.g. `standardbanner15`
   * @param {String} color e.g. `defaultcolor15`
   * @param {number} seasonLevel 
   */
  async setBRBanner(id, color, seasonLevel) {
    return this.data.setBRBanner(
      id, color, seasonLevel,
      this.party.members.map(member => member.jid),
    );
  }

  /**
   * Change player's input type, e.g. mouse and keyboard.
   * @param {EInputType} inputType 
   */
  async setInputType(inputType) {
    return this.data.setInputType(inputType, this.party.members.map(member => member.jid));
  }

  /**
   * Change BattlePass parameters.
   * @param {boolean} show
   * @param {number} passLevel
   * @param {number} selfBoostXp
   * @param {number} friendBoostXp
   */
  async setBattlePass(show, passLevel, selfBoostXp, friendBoostXp) {
    return this.data.setBattlePass(
      show, passLevel, selfBoostXp, friendBoostXp,
      this.party.members.map(member => member.jid),
    );
  }

  /**
   * Playing emote in lobby. Emote will be infinity playing. 
   * @param {string} asset e.g. `/Game/Athena/Items/Cosmetics/Dances/EID_KPopDance01.EID_KPopDance01`
   */
  async setEmote(asset) {
    return this.data.setEmote(asset, this.party.members.map(member => member.jid));
  }

  /**
   * Stop playing emote.
   */
  async clearEmote() {
    return this.data.clearEmote(this.party.members.map(member => member.jid));
  }

  /**
   * Kick a party member, or leaves if member is the bot
   * @returns {boolean}
   */
  async kick() {

    if (this.party.leader !== this.client.account.id) return false; // cannot kick if not party leader

    if (this.id === this.client.account.id) {
      this.party.exit(true);
      return true;
    }

    const sending = [];

    this.party.members.forEach((member) => {
      sending.push(
        this.communicator.sendRequest({
          to: member.jid,
          body: JSON.stringify({
  
            type: 'com.epicgames.party.memberexited',
      
            payload: {
              partyId: this.party.id,
              memberId: this.id,
              wasKicked: true,
            },
      
            timestamp: new Date(),
      
          }),
        }),
      );
    });

    await Promise.all(sending);
    return true;
  }

  async promote(leaderLeaving) {

    const sending = [];
    const member = this.party.findMemberById(this.id);
    
    const promote = new PartyMemberPromoted(this.communicator, {
      partyId: this.party.id,
      id: this.client.account.id,
      displayName: this.client.account.displayName,
      jid: this.communicator.stream.jid,
      member: {
        id: member.id,
        displayName: member.displayName,
        jid: member.jid,
      },
      leaderLeaving,
    });
    
    this.party.members.forEach((m) => {
      sending.push(promote.send(m.jid));
    });

    return Promise.all(sending);
  }

}

module.exports = PartyMember;
