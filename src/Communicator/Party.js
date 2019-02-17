const EventEmitter = require('events');

const EPartyPrivacy = require('../../enums/PartyPrivacy');

const PartyQueryJoinability = require('./PartyQueryJoinability');
const PartyJoinRequest = require('./PartyJoinRequest');
const PartyJoinAcknowledged = require('./PartyJoinAcknowledged');
const PartyJoinAcknowledgedResponse = require('./PartyJoinAcknowledgedResponse');
const PartyMemberJoined = require('./PartyMemberJoined');
const PartyMemberExited = require('./PartyMemberExited');
const PartyMember = require('./PartyMember');
const PartyData = require('./PartyData');
const PartyInvitation = require('./PartyInvitation');
const PartyQueryJoinabilityResponse = require('./PartyQueryJoinabilityResponse');
const PartyJoinRequestApproved = require('./PartyJoinRequestApproved');
const PartyUpdateConfirmation = require('./PartyUpdateConfirmation');

class Party extends EventEmitter {

  constructor(communicator, data, listen) {
    super();
    
    this.communicator = communicator;
    this.client = this.communicator.getClient();
    
    this.id = data.partyId;
    this.typeId = data.partyTypeId;
    this.accessKey = data.accessKey;
    this.password = data.password || '';

    this.appId = data.appId || null;
    this.buildId = data.buildId || null;

    this.leader = data.leader || null;

    this.presencePermissions = data.presencePermissions || 1765217027;
    this.invitePermissions = data.invitePermissions || 32515;

    this.flags = data.partyFlags || 7;

    this.members = data.members || [];
    this.members = this.members.map((member) => {
      
      if (member instanceof PartyMember) return member;
      
      return new PartyMember(this.communicator, this, member);

    });

    this.maxMembers = data.maxMembers || 4;

    this.notAcceptingReason = data.notAcceptingReason || 0;

    this.data = data.partyData || new PartyData(this.communicator, {
      accountId: this.client.account.id,
      displayName: this.client.account.displayName,
      partyId: this.id,
    });
    
    this.me = this.findMemberById(this.client.account.id) || new PartyMember(this.communicator, this, {
      accountId: this.client.account.id,
      displayName: this.client.account.displayName,
      jid: this.communicator.stream.jid,
    });

    if (listen) this.runListeners();

    this.chat = null;
    
  }

  static async make(communicator, options) {
    
    if (
      typeof options === 'undefined'
      || typeof options.typeId === 'undefined'
      || typeof options.appId === 'undefined'
      || typeof options.buildId === 'undefined'
    ) throw new Error('Options `typeId`, `appId`, and `buildId` are required.');

    const partyId = communicator.generateUUID();

    const party = new this(communicator, {
      partyId,
      partyTypeId: options.typeId || options.partyTypeId,
      accessKey: communicator.generateUUID(),
      partyFlags: options.partyFlags,
      notAcceptingMemberReason: options.notAcceptingMemberReason,
      maxMembers: options.maxMembers,
      password: options.password,
      presencePermissions: options.presencePermissions,
      invitePermissions: options.invitePermissions,
      leader: communicator.client.account.id,
      appId: options.appId,
      buildId: options.buildId,
      members: [
        {
          accountId: communicator.client.account.id,
          displayName: communicator.client.account.displayName,
          jid: communicator.stream.jid,
        },
      ],
    }, true);

    let properties = {};

    properties[`party.joininfodata.${party.typeId}_j`] = {
      sourceId: communicator.client.account.id,
      sourceDisplayName: communicator.client.account.displayName,
      sourcePlatform: 'WIN',
      partyId: party.id,
      partyTypeId: party.typeId,
      key: party.accessKey,
      appId: party.appId,
      buildId: party.buildId.toString(),
      partyFlags: party.flags,
      notAcceptingReason: party.notAcceptingMemberReason,
    };

    properties = {
      ...properties,
      FortBasicInfo_j: {
        homeBaseRating: 1,
      },
      FortLFG_I: '0',
      FortPartySize_i: 1,
      FortSubGame_i: 1,
      InUnjoinableMatch_b: false,
    };

    await communicator.updateStatus({
      status: JSON.stringify({
        Status: `Lobby Battle Royale - ${party.members.length} / ${party.maxMembers}`,
        bIsPlaying: false,
        bIsJoinable: true,
        bHasVoiceSupport: false,
        SessionId: '',
        Properties: properties,
      }),
    });
    
    communicator.party = party;

    return party;
  }

  runListeners() {

    this.onPartyData = this.onPartyData.bind(this);
    this.onMemberData = this.onMemberData.bind(this);
    this.onQueryJoinability = this.onQueryJoinability.bind(this);
    this.onJoinRequest = this.onJoinRequest.bind(this);
    this.onMemberJoined = this.onMemberJoined.bind(this);
    this.onMemberExited = this.onMemberExited.bind(this);
    this.onMemberPromoted = this.onMemberPromoted.bind(this);
    this.onJoinAcknowledged = this.onJoinAcknowledged.bind(this);

    this.communicator.on(`party#${this.id}:data`, this.onPartyData);
    this.communicator.on(`party#${this.id}:member:data`, this.onMemberData);
    this.communicator.on(`party#${this.id}:query:joinability`, this.onQueryJoinability);
    this.communicator.on(`party#${this.id}:join:request`, this.onJoinRequest);
    this.communicator.on(`party#${this.id}:member:joined`, this.onMemberJoined);
    this.communicator.on(`party#${this.id}:member:exited`, this.onMemberExited);
    this.communicator.on(`party#${this.id}:member:promoted`, this.onMemberPromoted);
    this.communicator.on(`party#${this.id}:joinacknowledged`, this.onJoinAcknowledged);
    
  }

  exit(kicked) {

    this.communicator.removeListener(`party#${this.id}:data`, this.onPartyData);
    this.communicator.removeListener(`party#${this.id}:member:data`, this.onMemberData);
    this.communicator.removeListener(`party#${this.id}:query:joinability`, this.onQueryJoinability);
    this.communicator.removeListener(`party#${this.id}:join:request`, this.onJoinRequest);
    this.communicator.removeListener(`party#${this.id}:member:joined`, this.onMemberJoined);
    this.communicator.removeListener(`party#${this.id}:member:exited`, this.onMemberExited);
    this.communicator.removeListener(`party#${this.id}:member:promoted`, this.onMemberPromoted);
    this.communicator.removeListener(`party#${this.id}:joinacknowledged`, this.onJoinAcknowledged);

    const memberExited = new PartyMemberExited(this.communicator, {
      accountId: this.client.account.id,
      displayName: this.client.account.displayName,
      jid: this.communicator.stream.jid,
      partyId: this.id,
      memberId: this.client.account.id,
      wasKicked: !!kicked,
    });

    this.members.forEach((member) => {
      memberExited.send(member.jid);
    });

    const newLeader = this.members.find(member => member.id !== this.client.account.id);
    newLeader.promote(true);

    this.communicator.updateStatus();

    const member = this.findMemberById(this.client.account.id);
    this.members.splice(this.members.indexOf(member), 1);
    this.me = null;

  }

  findMemberById(id) {
    return this.members.find(member => member.id === id);
  }

  /**
   * @function Kick a party member, or leaves if accountId is the bots id
   * @param {*} accountId 
   */
  kick(accountId) {

    if (this.leader === null) return; // no party leader set (bot made party, but didnt invite anyone)

    if (this.leader != this.client.account.id) return; // cannot kick if not party leader

    if (accountId == this.client.account.id) return this.exit(true);

    const memberToKick = this.findMemberById(accountId);
    
    if (memberToKick) {
      this.members.forEach(member => {
        var to = member.jid;
        this.communicator.sendRequest({
          to,
  
          body: JSON.stringify({
  
            type: 'com.epicgames.party.memberexited',
  
            payload: {
              partyId: this.id,
              memberId: accountId,
              wasKicked: true,
            },
  
            timestamp: new Date()
  
          })
  
        });
      });
    }

  }
  
  invite(jid) {

    if (typeof jid === 'string') jid = this.communicator.makeJID(jid);
    
    if (!this.findMemberById(this.client.account.id)) return;

    if (this.findMemberById(jid.local)) return;

    const invite = new PartyInvitation(this.communicator, {
      partyId: this.id,
      partyTypeId: this.typeId,
      displayName: this.client.account.displayName,
      accountId: this.client.account.id,
      accessKey: this.accessKey,
      appId: this.appId,
      buildId: this.buildId,
      party: this,
    });
    
    invite.send(jid);
    
  }

  async askToJoin(jid) {

    if (typeof jid === 'string') jid = this.communicator.makeJID(jid);

    this.runListeners();

    this.client.debug.print(`[Party#${this.id}] Asking to join`);

    const queryJoinability = new PartyQueryJoinability(this.communicator, {
      partyId: this.id,
      accountId: jid.local,
      accessKey: this.accessKey,
      appId: this.appId,
      buildId: this.buildId,
    });

    await queryJoinability.send(jid);
    const response = await this.waitForJoinabilityResponse();
    
    if (!response) return;

    await this.sendJoinRequest(response);
    const approve = await this.waitForApproveJoinRequest();

    this.presencePermissions = approve.presencePermissions;
    this.invitePermissions = approve.invitePermissions;
    this.maxMembers = approve.maxMembers;
    this.members = approve.members.map(member => new PartyMember(this.communicator, this, {
      accountId: member.id,
      displayName: member.displayName,
      jid: member.jid,
    }));
    this.password = approve.password;

    this.me = this.me || new PartyMember(this.communicator, this, {
      id: this.client.account.id,
      displayName: this.client.account.displayName,
      jid: this.communicator.stream.jid,
    });

    this.members.push(this.me);

    await this.sendJoinAcknowledged(approve);
    await this.waitForJoinAcknowledgedResponse();

    await this.waitForPartyData();

    this.client.party = this;
  }
  
  get partyState() { return this.data.partyState; }

  get privacySettings() { return this.data.privacySettings; }

  get allowJoinInProgress() { return this.data.allowJoinInProgress; }

  get isSquadFill() { return this.data.isSquadFill; }

  get partyIsJoinedInProgress() { return this.data.partyIsJoinedInProgress; }

  get gameSessionId() { return this.data.gameSessionId; }

  get gameSessionKey() { return this.data.gameSessionKey; }

  get connectionStarted() { return this.data.connectionStarted; }

  get matchmakingResult() { return this.data.matchmakingResult; }

  get matchmakingState() { return this.data.matchmakingState; }

  get playlist() { return this.data.playlist; }

  async onPartyData(data) {
    this.data = data;
  }

  async onQueryJoinability(query) {
    
    this.client.debug.print(`[Party#${this.id}] Received joinability query from ${query.sender.id}!`);

    if (this.leader === null) return;

    let response;

    if (this.leader === this.client.account.id) {

      this.client.debug.print(`[Party#${this.id}] You can join ${query.sender.id}!`);

      response = new PartyQueryJoinabilityResponse(this.communicator, {
        partyId: this.id,
        accountId: this.client.account.id,
        displayName: this.client.account.displayName,
        isJoinable: true,
        rejectionType: 0,
        resultParam: '',
      });

    } else {

      this.client.debug.print(`[Party#${this.id}] I'm not a leader, redirect ${query.sender.id} to ${this.leader}!`);

      response = new PartyQueryJoinabilityResponse(this.communicator, {
        partyId: this.id,
        accountId: this.client.account.id,
        displayName: this.client.account.displayName,
        isJoinable: false,
        rejectionType: 4,
        resultParam: this.leader,
      });

    }
  
    response.send(query.sender.jid);

  }

  async onJoinRequest(request) {

    if (this.leader !== this.client.account.id) return;

    const approve = new PartyJoinRequestApproved(this.communicator, {
      partyId: this.id,
      accountId: this.client.account.id,
      displayName: this.client.account.displayName,
      accessKey: this.accessKey,
      presencePermissions: this.presencePermissions,
      invitePermissions: this.invitePermissions,
      partyFlags: this.flags,
      notAcceptingMemberReason: this.notAcceptingMemberReason,
      maxMembers: this.maxMembers,
      password: this.password,
      members: this.members.map(member => ({
        id: member.id,
        displayName: member.displayName,
        xmppResource: member.jid.resource,
      })),
    });
  
    approve.send(request.sender.jid);
      
    const memberJoined = new PartyMemberJoined(this.communicator, {
      partyId: this.id,
      accountId: this.client.account.id,
      displayName: this.client.account.displayName,
      member: {
        accountId: request.sender.jid.local,
        displayName: request.sender.displayName,
        xmppResource: request.sender.jid.resource,
      },
    });

    this.addMember({
      id: request.sender.jid.local,
      displayName: request.sender.displayName,
      jid: request.sender.jid,
      partyId: this.id,
    });
      
    this.members.forEach((member) => {
      memberJoined.send(member.jid);
    });

  }

  addMember(data) {
    
    let member = this.findMemberById(data.id);

    if (member) {
      member.update(data);
    } else {
      member = new PartyMember(this.communicator, this, data);
      this.members.push(member);
    }

    return member;
  }

  async onJoinAcknowledged(joinAcknowledged) {

    const joinAcknowledgedResponse = new PartyJoinAcknowledgedResponse(this.communicator, {
      accountId: this.client.account.id,
      displayName: this.client.account.displayName,
      partyId: this.id,
    });

    await joinAcknowledgedResponse.send(joinAcknowledged.sender.jid);

  }

  onMemberJoined(joined) {
      
    if (this.client.account.id === joined.member.id) {
        
      this.members.forEach((member) => {
        this.me.data.send(member.jid);
      });

    } else {

      this.me.data.send(joined.member.jid);
      
      this.addMember({
        id: joined.member.id,
        displayName: joined.member.displayName,
        partyId: this.id,
        jid: joined.member.jid,
      });

    }

    this.emit('member:joined', joined);
    
  }

  onMemberExited(exited) {
    
    if (exited.member.id === this.client.account.id) {
      this.exit(exited.wasKicked);
      return;
    }

    const member = this.findMemberById(exited.member.id);
    this.members.splice(this.members.indexOf(member), 1);

    this.emit('member:exited', exited);

  }

  async onMemberData(memberData) {
    const member = this.addMember({
      id: memberData.sender.id,
      partyId: this.id,
      jid: memberData.sender.jid,
    });
    member.data.payload = { ...member.data.payload, ...memberData.payload };
  }

  async onMemberPromoted(promoted) {
    this.leader = promoted.member.id;
    this.emit('member:promoted', promoted);
  }

  async setPlaylist(playlistName, tournamentId, eventWindowId) {

    const sending = [];

    this.members.forEach((member) => {
      sending.push(this.data.setPlaylist(member.jid, playlistName, tournamentId, eventWindowId));
    });

    return Promise.all(sending);
  }

  async setPrivacy(privacy, allowFriends) {

    if (this.leader !== this.client.account.id) return false;

    this.accessKey = this.communicator.generateUUID();

    switch (privacy) {

      case EPartyPrivacy.Public:
        this.data.presencePermissions = 1765217027;
        this.data.invitePermissions = 32515;
        this.partyFlags = 7;
        this.notAcceptingMembersReason = 0;
        break;

      case EPartyPrivacy.Friends:
        this.data.presencePermissions = allowFriends ? 1765217027 : 1765217025;
        this.data.invitePermissions = allowFriends ? 32515 : 32513;
        this.partyFlags = 7;
        this.notAcceptingMembersReason = 0;
        break;

      case EPartyPrivacy.Private:
        this.data.presencePermissions = 1765217024;
        this.data.invitePermissions = allowFriends ? 32515 : 32513;
        this.partyFlags = 6;
        this.notAcceptingMembersReason = 7;
        break;

      default:
        throw new Error('Wrong `privacy` parameter.');

    }

    this.sendUpdateConfirmation();

    this.members.forEach((member) => {
      this.data.setPrivacy(member.jid, privacy, allowFriends);
    });

    return true;
  }

  async sendUpdateConfirmation() {
    
    const updateConfirmation = new PartyUpdateConfirmation(this.communicator, {
      partyId: this.id,
      partyTypeId: this.typeId,
      accountId: this.client.account.id,
      displayName: this.client.account.displayName,
      accessKey: this.accessKey,
      presencePermissions: this.presencePermissions,
      invitePermissions: this.invitePermissions,
      partyFlags: this.flags,
      notAcceptingMemberReason: this.notAcceptingMemberReason,
      maxMembers: this.maxMembers,
      password: this.password,
    });
    
    const sending = [];
    
    this.members.forEach((member) => {
      sending.push(updateConfirmation.send(member.jid));
    });

    return Promise.all(sending);
  }

  waitForJoinabilityResponse() {

    return new Promise((resolve, reject) => {
      
      this.communicator.once(`party#${this.id}:queryjoinability:response`, async (response) => {

        if (!response.isJoinable) {

          switch (response.rejectionType) {

            case 4: {

              const leaderJID = `${response.resultParam}@prod.ol.epicgames.com`;

              this.client.debug.print(`[Party#${this.id}] Asked jid isn't leader, redirecting to leader: ${leaderJID}`);
              resolve(this.askToJoin(leaderJID));
              
            } break;

            case 7:
              this.client.debug.print(`[Party#${this.id}] Cannot join into party. Reason: You are already in party.`);
              resolve(false);
              break;

            default:
              this.client.debug.print(`[Party#${this.id}] Cannot join into party. Rejection type: ${response.rejectionType}`);
              resolve(false);
              break;

          }

          return;
        }

        resolve(response);

      });

      setTimeout(() => {
        reject(new Error('No response on queryjoinability in 4 sec.'));
      }, 4000);

    });
  }

  async sendJoinRequest(response) {

    this.client.debug.print(`[Party#${this.id}] Sending join request...`);

    const joinRequest = new PartyJoinRequest(this.communicator, {
      partyId: this.id,
      accountId: this.client.account.id,
      displayName: this.client.account.displayName,
      platform: 'WIN',
      accessKey: this.accessKey,
      appId: this.appId,
      buildId: this.buildId,
      joinData: {
        Rev: 0,
        Attrs: {
          CrossplayPreference_i: 1,
        },
      },
    });

    await joinRequest.send(response.sender.jid);

  }

  waitForApproveJoinRequest() {
    return new Promise((resolve, reject) => {
      
      this.communicator.once(`party#${this.id}:join:approved`, async (approve) => {
        
        this.client.debug.print(`[Party#${this.id}] Join request has approved!`);

        this.presencePermissions = approve.presencePermissions;
        this.invitePermissions = approve.invitePermissions;
        this.flags = approve.partyFlags;
        this.notAcceptingMembersReason = approve.notAcceptingMemberReason;
        this.maxMembers = approve.maxMembers;
        this.password = approve.password;

        approve.members.forEach((member) => {
          this.addMember({
            id: member.id,
            displayName: member.displayName,
            jid: member.jid,
            partyId: this.id,
          });
        });

        resolve(approve);

      });

      setTimeout(() => {
        reject(new Error('Join reuqest hasn\'t approved in 4 sec.'));
      }, 4000);

    });
  }

  async sendJoinAcknowledged(approve) {

    this.client.debug.print(`[Party#${this.id}] Sending join acknowledged...`);

    const joinacknowledged = new PartyJoinAcknowledged(this.communicator, {
      accountId: this.client.account.id,
      displayName: this.client.account.displayName,
      partyId: this.id,
    });

    await joinacknowledged.send(approve.sender.jid);

    this.leader = approve.sender.jid.local;

  }

  waitForJoinAcknowledgedResponse() {
    return new Promise((resolve, reject) => {
      
      this.communicator.once(`party#${this.id}:joinacknowledged:response`, async (response) => {
        
        this.client.debug.print(`[Party#${this.id}] Received join acknowledged response!`);
        resolve(response);

      });

      setTimeout(() => {
        reject(new Error('Join aknowledged response hasn\'t received in 4 sec.'));
      }, 4000);
      
    });
  }

  waitForPartyData() {
    return new Promise((resolve, reject) => {
      
      setInterval(() => {
        
        if (this.data) resolve(true);

      }, 100);

      setTimeout(() => {
        reject(new Error('Not received party\'s data in 4 sec.'));
      }, 4000);
      
    });
  }

}

module.exports = Party;
