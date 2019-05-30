class Member {

  constructor(party, data) {
    this.party = party;
    this.app = this.party.app;
    this.id = data.accountId || data.account_id;
    this.connections = [];
    if (Array.isArray(data.connections)) {
      data.connections.forEach(connection => new this.app.PartyMemberConnection(this, connection));
    }
    this.joinedAt = new Date(data.joined_at);
    this.role = data.role || null;
    this.revision = 0;
    this.meta = new this.app.PartyMemberMeta(this, data.meta);
  }

  update(data) {
    if (data.revision > this.revision) this.revision = data.revision;
    this.meta.update(data.member_state_updated, true);
  }

  async patch(updated) {
    await this.app.http.send(
      'PATCH',
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${this.app.id}/parties/${this.party.id}/members/${this.id}/meta`,
      `${this.app.auth.tokenType} ${this.app.auth.accessToken}`,
      {
        delete: [],
        revision: this.revision,
        update: updated || this.meta.schema,
      },
    );
    this.revision += 1;
  }

  checkPermissions() {
    if (this.app.launcher.account.id !== this.id) {
      throw new Error('You can set only yourself meta.');
    }
  }

}

module.exports = Member;
