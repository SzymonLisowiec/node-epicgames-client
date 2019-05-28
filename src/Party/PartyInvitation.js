const PartyJoinRequest = require('./PartyJoinRequest');

class PartyInvitation {

  constructor(party, data) {

    this.party = party;
    this.app = this.party.app;
    
    this.meta = data.meta;
    this.appId = data.appId;
    this.time = data.time;

  }

  async accept() {
    if (this.app.party) await this.app.party.leave();
    this.app.party = this.party;
    await PartyJoinRequest.send(this.party);
  }

  async reject() {
    await this.app.http.sendPost(
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${this.app.id}/parties/${this.party.id}/invites/${this.app.launcher.account.id}/decline`,
      `${this.app.auth.tokenType} ${this.app.auth.accessToken}`,
      {},
    );
  }

  static async send(party, accountId) {
    await party.app.http.sendPost(
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${party.app.id}/parties/${party.id}/invites/${accountId}`,
      `${party.app.auth.tokenType} ${party.app.auth.accessToken}`,
      {
        'urn:epic:invite:platformdata_s': '',
        'urn:epic:member:dn_s': party.app.launcher.account.displayName,
        'urn:epic:conn:platform_s': party.app.config.platform.short,
        'urn:epic:conn:type_s': 'game',
        'urn:epic:cfg:build-id_s': party.app.config.netCL,
      },
    );
  }

}

module.exports = PartyInvitation;
