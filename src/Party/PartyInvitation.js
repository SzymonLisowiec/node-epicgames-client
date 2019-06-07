const PartyJoinRequest = require('./PartyJoinRequest');

class PartyInvitation {

  constructor(party, data) {

    this.party = party;
    this.app = this.party.app;
    
    this.meta = data.meta || [];
    this.time = data.time || data.sent_at;

    /*
    TODO: add another params
    { party_id: '2d235a015c174366a6aa90330ec193c7',
      sent_by: '9a1d43b1d826420e9fa393a79b74b2ff',
      meta:
      { 'urn:epic:conn:type_s': 'game',
        'urn:epic:conn:platform_s': 'WIN',
        'urn:epic:member:dn_s': 'Kysune',
        'urn:epic:cfg:build-id_s': '1:1:6477402',
        'urn:epic:invite:platformdata_s': '' },
      sent_to: 'd8f16571cfa94f018cc75df779b04ea6',
      sent_at: '2019-06-07T14:56:42.486Z',
      updated_at: '2019-06-07T14:56:42.486Z',
      expires_at: '2019-06-07T18:56:42.486Z',
      status: 'SENT' }
    */

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
    // await party.app.http.sendPost(
    //   `https://party-service-prod.ol.epicgames.com/party/api/v1/${party.app.id}/parties/${party.id}/invites/${accountId}`,
    //   `${party.app.auth.tokenType} ${party.app.auth.accessToken}`,
    //   {
    //     'urn:epic:invite:platformdata_s': '',
    //     'urn:epic:member:dn_s': party.app.launcher.account.displayName,
    //     'urn:epic:conn:platform_s': party.app.config.platform.short,
    //     'urn:epic:conn:type_s': 'game',
    //     'urn:epic:cfg:build-id_s': party.app.config.partyBuildId,
    //   },
    // );
    await party.app.http.send(
      'POST',
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${party.app.id}/user/${accountId}/pings/${party.app.launcher.account.id}`,
      `${party.app.auth.tokenType} ${party.app.auth.accessToken}`,
      {},
    );
  }

}

module.exports = PartyInvitation;
