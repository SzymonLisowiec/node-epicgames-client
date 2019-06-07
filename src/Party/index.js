const EPartyPrivacy = require('../../enums/PartyPrivacy');

class Party {

  constructor(app, data) {
    this.app = app;
    this.id = data.id;
    this.config = this.parseConfiguration(data.config);
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
    const m = this.findMember(member);
    if (!m) return;
    this.members.splice(this.members.indexOf(m), 1);
    if (this.app.config.autoPresenceUpdating) this.updatePresence();
  }

  invite(accountId) {
    return this.app.PartyInvitation.send(this, accountId);
  }

  async kick(kickedMember) {
    const member = this.findMember(kickedMember);
    if (member) await member.kick();
  }

  async promote(promotedMember) {
    const member = this.findMember(promotedMember);
    if (member) await member.promote();
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

  async patch(updated, deleted) {
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
          delete: deleted || [],
          update: updated || this.meta.schema,
        },
        party_state_overridden: {},
        party_privacy_type: this.config.joinability,
        party_type: this.config.type,
        party_sub_type: this.config.subType,
        max_number_of_members: this.config.maxSize,
        invite_ttl_seconds: this.config.inviteTTL,
        revision: this.revision,
      },
    );
    this.revision += 1;
  }

  updatePresence() {
    let partyJoinInfoData;
    
    if (
      this.config.privacy.presencePermission === 'None'
      || (this.config.privacy.presencePermission === 'Leader' && this.leader.id !== this.me.id)
    ) {
      partyJoinInfoData = {
        bInPrivate: true,
      };
    } else {
      partyJoinInfoData = {
        sourceId: this.app.launcher.account.id,
        sourceDisplayName: this.app.launcher.account.name,
        sourcePlatform: this.app.config.platform.short,
        partyId: this.id,
        partyTypeId: 286331153,
        key: 'k',
        appId: this.app.id,
        buildId: String(this.app.config.netCL),
        partyFlags: -2024557306,
        notAcceptingReason: 0,
        pc: this.members.length,
      };
    }

    this.app.communicator.updateStatus({
      Status: `Lobby Battle Royale - ${this.members.length} / ${this.config.maxSize}`,
      bIsPlaying: true,
      bIsJoinable: false,
      bHasVoiceSupport: false,
      SessionId: '',
      Properties: {
        'party.joininfodata.286331153_j': partyJoinInfoData,
        FortBasicInfo_j: {
          homeBaseRating: 1,
        },
        FortLFG_I: '0',
        FortPartySize_i: 1,
        FortSubGame_i: 1,
        InUnjoinableMatch_b: false,
        FortGameplayStats_j: {
          state: '',
          playlist: 'None',
          numKills: 0,
          bFellToDeath: false,
        },
      },
    });

  }

  update(data) {
    if (this.app.config.autoPresenceUpdating) this.updatePresence();
    if (data.revision > this.revision) this.revision = data.revision;
    this.config.joinability = data.party_privacy_type;
    this.config.maxSize = data.max_number_of_members;
    this.config.subType = data.party_sub_type;
    this.config.type = data.party_type;
    this.config.inviteTTL = data.invite_ttl_seconds;
    this.meta.update(data.party_state_updated, true);
    this.meta.remove(data.party_state_removed);

    let privacy = this.meta.get('PrivacySettings_j');
    privacy = Object.values(EPartyPrivacy).find((p) => {
      return p.partyType === privacy.PrivacySettings.partyType
      && p.inviteRestriction === privacy.PrivacySettings.partyInviteRestriction
      && p.onlyLeaderFriendsCanJoin === privacy.PrivacySettings.bOnlyLeaderFriendsCanJoin;
    });
    if (privacy) this.config.privacy = privacy;
    
  }

  parseConfiguration(config) {
    if (!config) config = {};
    if (config.join_confirmation) {
      config.joinConfirmation = config.join_confirmation;
      delete config.join_confirmation;
    }
    if (config.max_size) {
      config.maxSize = config.max_size;
      delete config.max_size;
    }
    if (config.max_size) {
      config.maxSize = config.max_size;
      delete config.max_size;
    }
    if (config.invite_ttl_seconds) {
      config.inviteTTL = config.invite_ttl_seconds;
      delete config.invite_ttl_seconds;
    }
    if (config.sub_type) {
      config.subType = config.sub_type;
      delete config.sub_type;
    }
    return {
      ...this.app.config.defaultPartyConfig,
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

  static async lookupUser(app, id) {
    const { data } = await app.http.sendGet(
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${app.id}/user/${id}`,
      `${app.auth.tokenType} ${app.auth.accessToken}`,
    );
    return data;
  }

  static async create(app, config) { 
    if (!app.communicator) return null;
    config = {
      ...app.config.defaultPartyConfig,
      ...config,
    };
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
          'urn:epic:cfg:party-type-id_s': 'default',
          'urn:epic:cfg:build-id_s': String(app.config.partyBuildId),
          'urn:epic:cfg:join-request-action_s': 'Manual',
          'urn:epic:cfg:chat-enabled_b': String(config.chatEnabled),
        },
      },
    );
    data.config = {
      ...config,
      ...data.config,
    };
    app.party = new this(app, data);
    await app.party.waitForRevision(1);
    await app.party.setPrivacy(config.privacy);
    await app.party.waitForRevision(2);
    return app.party;
  }

  async waitForRevision(revision) {
    return new Promise((resolve, reject) => {
      let sto;
      const siv = setInterval(() => {
        if (this.revision < revision) return;
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

  setPrivacy(...args) {
    return this.meta.setPrivacy(...args);
  }

}

module.exports = Party;
