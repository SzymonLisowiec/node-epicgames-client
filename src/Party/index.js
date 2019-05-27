const Member = require('./Member');
const PartyInvitation = require('./PartyInvitation');
const PartyMeta = require('./PartyMeta');

class Party {

  constructor(app, data) {
    this.app = app;
    this.id = data.id;
    this.config = Party.parseConfiguration(data.config);
    this.members = [];
    if (Array.isArray(data.members)) data.members.forEach(member => this.members.push(new Member(this, member)));
    this.applicants = data.applicants || [];
    this.invites = data.invites || [];
    this.revision = data.revision || 0;
    this.meta = new PartyMeta(this, data.meta);
  }

  get leader() {
    return this.members.find(member => member.role === 'CAPTAIN');
  }

  findMember(id) {
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
    return PartyInvitation.send(this, accountId);
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
            'urn:epic:conn:platform_s': 'WIN',
            'urn:epic:conn:type_s': 'game',
          },
        },
        meta: {
          'urn:epic:member:dn_s': this.app.launcher.account.displayName,
          'urn:epic:member:type_s': 'game',
          'urn:epic:member:platform_s': 'WIN',
          'urn:epic:member:joinrequest_j': '{"CrossplayPreference_i":"1"}',
        },
      },
    );
    this.app.party = null;
  }

  // join() {
  // }

  static async lookup(app, id) {
    const { data } = await app.http.sendGet(
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${app.id}/parties/${id}`,
      `${app.auth.tokenType} ${app.auth.accessToken}`,
    );
    return new this(app, data);
  }

  async patch() {
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
          update: this.meta.schema,
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

  static async create(app, config) {
    if (!app.communicator) return null;
    config = Party.parseConfiguration(config);
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
              'urn:epic:conn:platform_s': 'WIN',
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
        'urn:epic:cfg:build-id_s': app.buildId,
        'urn:epic:cfg:presence-perm_s': 'None',
        'urn:epic:cfg:not-accepting-members-reason_i': 0,
        'urn:epic:cfg:accepting-members_b': true,
      },
    );
    return new this(app, data);
  }

}

module.exports = Party;
