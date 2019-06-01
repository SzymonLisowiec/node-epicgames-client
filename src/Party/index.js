class Party {

  constructor(app, data) {
    this.app = app;
    this.id = data.id;
    this.config = this.app.Party.parseConfiguration(data.config);
    this.members = [];
    if (Array.isArray(data.members)) data.members.forEach(member => this.members.push(new this.app.PartyMember(this, member)));
    this.applicants = data.applicants || [];
    this.invites = data.invites || [];
    this.revision = data.revision || 0;
    this.meta = new this.app.PartyMeta(this, data.meta);
  }

  get leader() {
    return this.members.find(member => member.role === 'CAPTAIN');
  }

  get me() {
    return this.members.find(member => member.id === this.app.launcher.account.id);
  }

  findMember(searchedUser) {
    const id = searchedUser instanceof this.app.PartyMember ? searchedUser.id : searchedUser;
    return this.members.find(member => member.id === id);
  }

  addMember(member) {
    if (this.findMember(member.id)) return;
    this.members.push(member);
  }

  removeMember(member) {
    const m = this.findMember(typeof member === 'string' ? member : member.id);
    if (!m) return;
    this.members.slice(this.members.indexOf(m), 1);
  }

  invite(accountId) {
    return this.app.PartyInvitation.send(this, accountId);
  }

  async kick(kickedMember) {
    const member = this.findMember(kickedMember);
    if (member) await member.kick();
  }

  async leave() {
    await this.app.http.send(
      'DELETE',
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${this.app.id}/parties/${this.id}/members/${this.app.launcher.account.id}`,
      `${this.app.auth.tokenType} ${this.app.auth.accessToken}`,
      {
        connection: {
          id: this.app.communicator.stream.jid.toString(),
          meta: {
            'urn:epic:conn:platform_s': this.app.config.platform.short,
            'urn:epic:conn:type_s': 'game',
          },
        },
        meta: {
          'urn:epic:member:dn_s': this.app.launcher.account.displayName,
          'urn:epic:member:type_s': 'game',
          'urn:epic:member:platform_s': this.app.config.platform.short,
          'urn:epic:member:joinrequest_j': '{"CrossplayPreference_i":"1"}',
        },
      },
    );
    this.app.party = null;
  }

  // join() {
  // }

  async patch(updated) {
    await this.app.http.send(
      'PATCH',
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${this.app.id}/parties/${this.id}`,
      `${this.app.auth.tokenType} ${this.app.auth.accessToken}`,
      {
        config: {
          join_confirmation: this.config.joinConfirmation,
          joinability: this.config.joinability,
          max_size: this.config.maxSize,
        },
        meta: {
          delete: [],
          update: updated || this.meta.schema,
        },
        revision: this.revision,
      },
    );
    this.revision += 1;
  }

  update(data) {
    if (data.revision > this.revision) this.revision = data.revision;
    this.config.joinability = data.party_privacy_type;
    this.config.maxSize = data.max_number_of_members;
    this.meta.update(data.party_state_updated, true);
  }

  static parseConfiguration(config) {
    if (!config) config = {};
    if (config.join_confirmation) {
      config.joinConfirmation = config.join_confirmation;
      delete config.join_confirmation;
    }
    if (config.max_size) {
      config.maxSize = config.max_size;
      delete config.max_size;
    }
    return {
      joinConfirmation: true,
      joinability: 'OPEN',
      maxSize: 16,
      ...config,
    };
  }

  static async lookup(app, id) {
    const { data } = await app.http.sendGet(
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${app.id}/parties/${id}`,
      `${app.auth.tokenType} ${app.auth.accessToken}`,
    );
    return new this(app, data);
  }

  static async create(app, config) {
    if (!app.communicator) return null;
    config = app.Party.parseConfiguration(config);
    const { data } = await app.http.sendPost(
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${app.id}/parties`,
      `${app.auth.tokenType} ${app.auth.accessToken}`,
      {
        config: {
          join_confirmation: config.joinConfirmation,
          joinability: config.joinability,
          max_size: config.maxSize,
        },
        join_info: {
          connection: {
            id: app.communicator.stream.jid.toString(),
            meta: {
              'urn:epic:conn:platform_s': app.config.platform.short,
              'urn:epic:conn:type_s': 'game',
            },
          },
        },
        meta: {
          'urn:epic:cfg:party-notification-id_s': 'default',
          'urn:epic:cfg:join-request-action_s': 'manual',
        },
        'urn:epic:cfg:chat-enabled_b': true,
        'urn:epic:cfg:invite-perm_s': 'None',
        'urn:epic:cfg:build-id_s': app.config.netCL,
        'urn:epic:cfg:presence-perm_s': 'None',
        'urn:epic:cfg:not-accepting-members-reason_i': 0,
        'urn:epic:cfg:accepting-members_b': true,
      },
    );
    app.party = new this(app, data);
    await app.party.waitForFirstRevision();
    return app.party;
  }

  async waitForFirstRevision() {
    return new Promise((resolve, reject) => {
      let sto;
      const siv = setInterval(() => {
        if (this.revision === 0) return;
        clearInterval(siv);
        clearTimeout(sto);
        resolve();
      }, 250);
      sto = setTimeout(() => {
        clearInterval(siv);
        clearTimeout(sto);
        reject(new Error('Timeout, no `PARTY_UPDATED` event in 5 seconds.'));
      }, 5000);
    });
  }

}

module.exports = Party;
