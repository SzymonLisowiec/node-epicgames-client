class PartyJoinRequest {

  constructor(party) {
    this.party = party;
  }

  static async send(party) {
    const { app } = party;
    const { data } = await app.http.sendPost(
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${app.id}/parties/${party.id}/members/${app.launcher.account.id}/join`,
      `${app.auth.tokenType} ${app.auth.accessToken}`,
      {
        connection: {
          id: app.communicator.stream.jid.toString(),
          meta: {
            'urn:epic:conn:platform_s': app.config.platform.short,
            'urn:epic:conn:type_s': 'game',
          },
        },
        meta: {
          'urn:epic:member:dn_s': app.launcher.account.displayName,
          'urn:epic:member:type_s': 'game',
          'urn:epic:member:platform_s': app.config.platform.short,
          'urn:epic:member:joinrequest_j': '{"CrossplayPreference_i":"1"}',
        },
      },
    );
    return new this(party, data);
  }

}

module.exports = PartyJoinRequest;
