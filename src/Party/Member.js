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
    this.revision = data.revision || 0;
    this.meta = new this.app.PartyMemberMeta(this, data.meta);

    this.isPatching = false;
    this.patchQueue = [];

  }

  update(data) {
    if (data.revision > this.revision) this.revision = data.revision;
    this.meta.update(data.member_state_updated, true);
    this.meta.remove(data.member_state_removed);
  }

  async kick() {
    if (this.party.me.id !== this.party.leader.id) throw new Error('You aren\'t the party leader!');
    if (this.party.me.id === this.id) throw new Error('You can\'t kick yourself!');
    
    await this.app.http.send(
      'DELETE',
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${this.app.id}/parties/${this.party.id}/members/${this.id}`,
      `${this.app.auth.tokenType} ${this.app.auth.accessToken}`,
    );

    this.party.removeMember(this);
  }

  async promote() {
    if (this.party.me.id !== this.party.leader.id) throw new Error('You aren\'t the party leader!');
    if (this.party.me.id === this.id) throw new Error('You can\'t promote yourself!');

    await this.app.http.send(
      'POST',
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${this.app.id}/parties/${this.party.id}/members/${this.id}/promote`,
      `${this.app.auth.tokenType} ${this.app.auth.accessToken}`,
    );
  }

  async patch(updated, isForced) {

    if (!isForced && this.isPatching) {
      this.patchQueue.push([updated]);
      return;
    }

    this.isPatching = true;
    const revision = parseInt(this.revision, 10);
    
    await this.app.http.send(
      'PATCH',
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${this.app.id}/parties/${this.party.id}/members/${this.id}/meta`,
      `${this.app.auth.tokenType} ${this.app.auth.accessToken}`,
      {
        delete: [],
        revision,
        update: updated || this.meta.schema,
      },
    );

    if (this.revision === revision) this.revision += 1;
    
    if (this.patchQueue.length > 0) {
      const args = this.patchQueue.shift();
      this.patch(...args, true);
    } else {
      this.isPatching = false;
    }

  }

  checkPermissions() {
    if (this.app.launcher.account.id !== this.id) {
      throw new Error('You can set only yourself meta.');
    }
  }

}

module.exports = Member;
