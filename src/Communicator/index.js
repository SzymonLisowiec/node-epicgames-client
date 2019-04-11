const { JID, createClient: XMPPClient } = require('stanza.io');
const EventEmitter = require('events');
const UUID = require('uuid/v4');

const EUserState = require('../../enums/UserState');

const Friend = require('../Friend');
const FriendRequest = require('../FriendRequest');
const FriendMessage = require('./FriendMessage');

const Party = require('./Party');
const PartyInvitation = require('./PartyInvitation');
const PartyJoinRequest = require('./PartyJoinRequest');
const PartyJoinRequestApproved = require('./PartyJoinRequestApproved');
const PartyJoinAcknowledged = require('./PartyJoinAcknowledged');
const PartyJoinAcknowledgedResponse = require('./PartyJoinAcknowledgedResponse');
const PartyMemberData = require('./PartyMemberData');
const PartyMemberJoined = require('./PartyMemberJoined');
const PartyMemberExited = require('./PartyMemberExited');
const PartyMemberPromoted = require('./PartyMemberPromoted');
const PartyData = require('./PartyData');
const PartyQueryJoinability = require('./PartyQueryJoinability');
const PartyQueryJoinabilityResponse = require('./PartyQueryJoinabilityResponse');
const PartyInvitationResponse = require('./PartyInvitationResponse');
const PartyUpdateConfirmation = require('./PartyUpdateConfirmation');

class Communicator extends EventEmitter {

  constructor(app, host, url) {
    super();
    
    this.app = app;

    const uuid = this.generateUUID();

    if (this.app.appName === 'Launcher') {
      this.client = this.app;
      this.resource = `V2:launcher:WIN::${uuid}`;
    } else {
      this.client = this.app.launcher;
      this.resource = `V2:${this.app.appName}:WIN::${uuid}`;
    }
    
    this.host = host || 'prod.ol.epicgames.com';
    this.url = url || 'xmpp-service-prod.ol.epicgames.com';

  }

  generateUUID() {
    return UUID().replace(/-/g, '').toUpperCase();
  }

  makeJID(...args) {
    return new JID(...args);
  }

  getClient() {
    return this.client;
  }

  async makeParty(options) { // EXPERIMENTAL
    return Party.make(this, options);
  }

  connect(authToken) {
    return new Promise((resolve) => {

      this.stream = new XMPPClient({

        wsURL: `wss://${this.url}`,
        transport: 'websocket',
        server: this.host,
  
        credentials: {
          jid: `${this.client.account.id}@${this.host}`,
          host: this.host,
          username: this.client.account.id,
          password: authToken || this.client.account.auth.accessToken,
        },

        resource: this.resource,
        
      });
  
      this.stream.enableKeepAlive({
        interval: 60,
      });
      
      this.listenFriendsList();
      this.listenFriendStates();
      this.listenMessages();

      this.stream.on('raw:incoming', (xml) => {
        this.emit('raw:incoming', xml);
      });
  
      this.stream.on('raw:outgoing', (xml) => {
        this.emit('raw:outgoing', xml);
      });

      this.stream.once('connected', async () => {

        this.emit('connected');

        this.client.debug.print(`Communicator[${this.resource}]: Connected`);

      });

      this.stream.once('disconnected', async () => {

        this.emit('disconnected');

        this.client.debug.print(`Communicator[${this.resource}]: Disconnected`);
        this.client.debug.print(`Communicator[${this.resource}]: Trying reconnect...`);

        await this.disconnect(true);
        this.stream.connect();

      });

      this.stream.once('session:end', async () => {

        this.emit('session:ended');

        this.client.debug.print(`Communicator[${this.resource}]: Session ended`);

        this.client.debug.print(`Communicator[${this.resource}]: There will be try of restart connection to obtain new session (at the moment I'm only testing this solution).`);
        this.client.debug.print(`Communicator[${this.resource}]: Trying restart connection to obtain new session...`);
        
        await this.disconnect();
        this.stream.connect();

      });
      
      this.stream.once('session:started', async () => {

        this.emit('session:started');

        this.client.debug.print(`Communicator[${this.resource}]: Session started`);

        await this.refreshFriendsList();
        await this.updateStatus();

        resolve();
      });
      
      this.stream.once('session:bound', () => {

        this.emit('session:bound');

        this.client.debug.print(`Communicator[${this.resource}]: Session bounded`);
      });
      
      this.stream.connect();

    });
  }

  disconnect(isAlreadyDisconnected, removeAllListeners) {
    return new Promise((resolve) => {
      
      this.stream.off('disconnected');
      this.stream.off('session:end');
      this.stream.off('session:started');
      this.stream.off('session:bound');

      if (removeAllListeners) this.removeAllListeners();

      if (typeof isAlreadyDisconnected !== 'undefined' && isAlreadyDisconnected) {
        resolve();
        return;
      }

      this.stream.disconnect();

      this.stream.once('disconnected', () => {

        this.client.debug.print(`Communicator[${this.resource}]: Disconnected`);
        
        resolve();

      });


    });
  }

  listenFriendsList() {

    this.stream.on('iq', (stanza) => {
      
      if (stanza.roster && stanza.type === 'result') {

        const friends = stanza.roster.items ? stanza.roster.items.map(friend => ({
          accountId: friend.jid.local,
        })) : [];

        this.emit('friends', friends);

      }

    });

  }

  listenFriendStates() {
    
    this.stream.on('presence', (stanza) => {
      
      let state = EUserState.Offline;

      if (stanza.type === 'available') {
        state = stanza.show ? EUserState.Online : EUserState.Away;
      }
      
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const Status = require(`${this.app.libraryName}/src/Communicator/Status`);
      
      this.emit('friend:status', new Status(this, {
        accountId: stanza.from.local,
        jid: stanza.from,
        state,
        status: stanza.status,
      }));
      
    });

  }

  listenMessages() {

    this.stream.on('message', (stanza) => {
      
      if (stanza.type === 'normal') {

        const body = JSON.parse(stanza.body);

        switch (body.type) {

          case 'com.epicgames.friends.core.apiobjects.Friend':
            /*
            {
              payload: {
                accountId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                status: 'PENDING',
                direction: 'INBOUND',
                created: '2018-10-19T12:01:42.551Z',
                favorite: false
              },
              
              type: 'com.epicgames.friends.core.apiobjects.Friend',
              timestamp: '2018-10-19T12:01:42.553Z'
            }
            */
            break;

          case 'com.epicgames.friends.core.apiobjects.FriendRemoval':
            /*
            {
              payload: {
                 accountId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                 reason: 'DELETED'
              },
              
              type: 'com.epicgames.friends.core.apiobjects.FriendRemoval',
              timestamp: '2018-10-25T15:43:12.114Z'
            }
            */
            break;

          case 'com.epicgames.party.invitation': {

            const payload = {
              accountId: stanza.from.local,
              accountName: body.payload.displayName,
              jid: stanza.from,
              partyId: body.payload.partyId,
              partyTypeId: body.payload.partyTypeId,
              accessKey: body.payload.accessKey,
              appId: body.payload.appId,
              buildId: body.payload.buildId,
              time: new Date(body.timestamp),
            };

            payload.party = new Party(this, payload);

            this.emit('party:invitation', new PartyInvitation(this, payload));
            this.emit(`party#${payload.partyId}:invitation`, new PartyInvitation(this, payload));

          } break;

          case 'com.epicgames.party.invitationresponse': {
            
            const payload = {
              accountId: stanza.from.local,
              accountName: body.payload.displayName,
              jid: stanza.from,
              partyId: body.payload.partyId,
              response: body.payload.response, // 2 = rejected
              time: new Date(body.timestamp),
            };

            this.emit('party:invitation:response', new PartyInvitationResponse(this, payload));
            this.emit(`party#${payload.partyId}:invitation:response`, new PartyInvitationResponse(this, payload));

          } break;

          case 'com.epicgames.party.joinrequest': {

            const payload = {
              accountId: stanza.from.local,
              jid: stanza.from,
              displayName: body.payload.displayName,
              partyId: body.payload.partyId,
              platform: body.payload.platform,
              accessKey: body.payload.accessKey,
              appId: body.payload.appId,
              buildId: body.payload.buildId,
              time: new Date(body.timestamp),
            };

            this.emit('party:join:request', new PartyJoinRequest(this, payload));
            this.emit(`party#${payload.partyId}:join:request`, new PartyJoinRequest(this, payload));

          } break;

          case 'com.epicgames.party.joinrequest.approved': {

            const payload = {
              accountId: stanza.from.local,
              jid: stanza.from,
              partyId: body.payload.partyId,
              partyTypeId: body.payload.partyTypeId,
              accessKey: body.payload.accessKey,
              presencePermissions: body.payload.presencePermissions,
              invitePermissions: body.payload.invitePermissions,
              partyFlags: body.payload.partyFlags,
              notAcceptingMemberReason: body.payload.notAcceptingMembersReason,
              maxMembers: body.payload.maxMembers,
              password: body.payload.password,
              members: body.payload.members,
              time: new Date(body.timestamp),
            };

            this.emit('party:join:approved', new PartyJoinRequestApproved(this, payload));
            this.emit(`party#${payload.partyId}:join:approved`, new PartyJoinRequestApproved(this, payload));

          } break;

          case 'com.epicgames.party.updatepartyconfiguration': {

            const payload = {
              accountId: stanza.from.local,
              jid: stanza.from,
              partyId: body.payload.partyId,
              accessKey: body.payload.accessKey,
              presencePermissions: body.payload.presencePermissions,
              invitePermissions: body.payload.invitePermissions,
              partyFlags: body.payload.partyFlags,
              notAcceptingMemberReason: body.payload.notAcceptingMembersReason,
              maxMembers: body.payload.maxMembers,
              password: body.payload.password,
              time: new Date(body.timestamp),
            };

            this.emit('party:updatepartyconfiguration', new PartyUpdateConfirmation(this, payload));
            this.emit(`party#${payload.partyId}:updatepartyconfiguration`, new PartyUpdateConfirmation(this, payload));

          } break;

          case 'com.epicgames.party.joinrequest.rejected': {

            const payload = {
              accountId: stanza.from.local,
              jid: stanza.from,
              partyId: body.payload.partyId,
              rejectionType: body.payload.rejectionType,
              resultParam: body.payload.resultParam,
              time: new Date(body.timestamp),
            };

            this.emit('party:join:rejected', new PartyMemberJoined(this, payload));
            this.emit(`party#${payload.partyId}:join:rejected`, new PartyMemberJoined(this, payload));
          
          } break;

          case 'com.epicgames.party.memberjoined': {

            const payload = {
              accountId: stanza.from.local,
              jid: stanza.from,
              partyId: body.payload.partyId,
              member: body.payload.member,
              time: new Date(body.timestamp),
            };

            this.emit('party:member:joined', new PartyMemberJoined(this, payload));
            this.emit(`party#${payload.partyId}:member:joined`, new PartyMemberJoined(this, payload));

          } break;

          case 'com.epicgames.party.memberexited': {

            const payload = {
              accountId: stanza.from.local,
              jid: stanza.from,
              partyId: body.payload.partyId,
              memberId: body.payload.memberId,
              wasKicked: body.payload.wasKicked,
              time: new Date(body.timestamp),
            };

            this.emit('party:member:exited', new PartyMemberExited(this, payload));
            this.emit(`party#${payload.partyId}:member:exited`, new PartyMemberExited(this, payload));

          } break;

          case 'com.epicgames.party.memberpromoted': {

            const payload = {
              accountId: stanza.from.local,
              jid: stanza.from,
              partyId: body.payload.partyId,
              member: body.payload.promotedMemberUserId,
              leaderLeaving: body.payload.fromLeaderLeaving,
              time: new Date(body.timestamp),
            };

            this.emit('party:member:promoted', new PartyMemberPromoted(this, payload));
            this.emit(`party#${payload.partyId}:member:promoted`, new PartyMemberPromoted(this, payload));

          } break;

          case 'com.epicgames.party.data': {

            const payload = {
              accountId: stanza.from.local,
              jid: stanza.from,
              partyId: body.payload.partyId,
              payload: body.payload.payload,
              time: new Date(body.timestamp),
            };

            this.emit('party:data', new PartyData(this, payload));
            this.emit(`party#${payload.partyId}:data`, new PartyData(this, payload));

          } break;

          case 'com.epicgames.party.memberdata': {

            const payload = {
              accountId: stanza.from.local,
              jid: stanza.from,
              partyId: body.payload.partyId,
              payload: body.payload.payload,
              time: new Date(body.timestamp),
            };

            this.emit('party:member:data', new PartyMemberData(this, payload));
            this.emit(`party#${payload.partyId}:member:data`, new PartyMemberData(this, payload));
            
          } break;

          case 'com.epicgames.party.queryjoinability': {

            const payload = {
              accountId: stanza.from.local,
              jid: stanza.from,
              partyId: body.payload.partyId,
              accessKey: body.payload.accessKey,
              appId: body.payload.appId,
              buildId: body.payload.buildId,
              joinData: body.payload.joinData,
              time: new Date(body.timestamp),
            };

            this.emit('party:query:joinability', new PartyQueryJoinability(this, payload));
            this.emit(`party#${payload.partyId}:query:joinability`, new PartyQueryJoinability(this, payload));

          } break;

          case 'com.epicgames.party.queryjoinability.response': {

            const payload = {
              accountId: stanza.from.local,
              jid: stanza.from,
              partyId: body.payload.partyId,
              isJoinable: body.payload.isJoinable,
              rejectionType: body.payload.rejectionType,
              resultParam: body.payload.resultParam,
              time: new Date(body.timestamp),
            };

            this.emit('party:queryjoinability:response', new PartyQueryJoinabilityResponse(this, payload));
            this.emit(`party#${payload.partyId}:queryjoinability:response`, new PartyQueryJoinabilityResponse(this, payload));
            
          } break;

          case 'com.epicgames.party.joinacknowledged': {
            
            const payload = {
              accountId: stanza.from.local,
              jid: stanza.from,
              partyId: body.payload.partyId,
              time: new Date(body.timestamp),
            };

            this.emit('party:joinacknowledged', new PartyJoinAcknowledged(this, payload));
            this.emit(`party#${payload.partyId}:joinacknowledged`, new PartyJoinAcknowledged(this, payload));

          } break;

          case 'com.epicgames.party.joinacknowledged.response': {
            
            const payload = {
              accountId: stanza.from.local,
              jid: stanza.from,
              partyId: body.payload.partyId,
              time: new Date(body.timestamp),
            };

            this.emit('party:joinacknowledged:response', new PartyJoinAcknowledgedResponse(this, payload));
            this.emit(`party#${payload.partyId}:joinacknowledged:response`, new PartyJoinAcknowledgedResponse(this, payload));

          } break;

          case 'FRIENDSHIP_REMOVE':
            this.emit('friend:removed', new Friend(this.client, {
              accountId: body.from,
              status: 'REMOVED',
              time: new Date(body.timestamp),
              reason: body.reason,
            }));
            break;

          case 'FRIENDSHIP_REQUEST':
            
            if (body.status === 'ACCEPTED') {
              
              this.emit('friend:added', new Friend(this.client, {
                accountId: body.to,
                status: body.status,
                time: new Date(body.timestamp),
              }));

            } else {

              this.emit('friend:request', new FriendRequest(this.client, {
                accountId: this.client.account.id === body.from ? body.to : body.from,
                direction: this.client.account.id === body.from ? 'OUTGOING' : 'INCOMING',
                status: body.status,
                time: new Date(body.timestamp),
              }));

            }
            break;

          default:
            this.client.debug.print(`Communicator[${this.resource}]: Unexpected \`message\` type: ${body.type}`);
            break;

        }

      } else if (stanza.type === 'chat') {
        
        this.emit('friend:message', new FriendMessage(this, {
          accountId: stanza.from.local,
          status: 'ACCEPTED', // status for Friend
          message: stanza.body,
          time: new Date(),
        }));

      } else if (stanza.type === 'error') {

        this.client.debug.print(`Communicator[${this.resource}]: Stanza error!`);
        // eslint-disable-next-line no-console
        console.dir(stanza);
        
      } else {

        this.client.debug.print(`Communicator[${this.resource}]: Unknown stanza type!`);
        // eslint-disable-next-line no-console
        console.dir(stanza);

      }

      
    });

  }

  async sendMessage(to, message) {

    to = `${to}@${this.host}`;

    return this.sendRequest({
      to: new JID(to),
      type: 'chat',
      body: message,
    });

  }

  async sendRequest(data) {
    return this.stream.sendMessage(data);
  }

  async refreshFriendsList() {
    return this.stream.getRoster();
  }

  async updateStatus(status) {
    
    if (!status) return this.stream.sendPresence(null);
    
    if (typeof status === 'string') {

      return this.stream.sendPresence({
        status: {
          status,
        },
      });

    }

    return this.stream.sendPresence(status);
  }

  /**
   * Sending request for presence.
   * @param {(JID|string)} to 
   */
  async sendProbe(to) {

    return this.stream.sendPresence({
      to,
      type: 'probe',
    });

  }

}

module.exports = Communicator;
