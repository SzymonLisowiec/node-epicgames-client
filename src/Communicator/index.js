const { JID, createClient: XMPPClient } = require('stanza.io');
const EventEmitter = require('events');
const UUID = require('uuid/v4');

const EUserState = require('../../enums/UserState');

const Status = require('./Status');
const Friend = require('../Friend');
const FriendRequest = require('../FriendRequest');
const FriendMessage = require('./FriendMessage');

class Communicator extends EventEmitter {

  constructor(app, host, url) {
    super();
    
    this.app = app;

    const uuid = this.generateUUID();

    if (this.app.id === 'Launcher') {
      this.launcher = this.app;
      this.resource = `V2:launcher:WIN::${uuid}`;
    } else {
      this.launcher = this.app.launcher;
      this.resource = `V2:${this.app.id}:WIN::${uuid}`;
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

  connect(authToken) {
    return new Promise((resolve) => {

      this.stream = new XMPPClient({

        wsURL: `wss://${this.url}`,
        transport: 'websocket',
        server: this.host,
  
        credentials: {
          jid: `${this.launcher.account.id}@${this.host}`,
          host: this.host,
          username: this.launcher.account.id,
          password: authToken || this.launcher.account.auth.accessToken,
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

        this.launcher.debug.print(`Communicator[${this.resource}]: Connected`);

      });

      this.stream.once('disconnected', async () => {

        this.emit('disconnected');

        this.launcher.debug.print(`Communicator[${this.resource}]: Disconnected`);
        this.launcher.debug.print(`Communicator[${this.resource}]: Trying reconnect...`);

        await this.disconnect(true);
        this.stream.connect();

      });

      this.stream.once('session:end', async () => {

        this.emit('session:ended');

        this.launcher.debug.print(`Communicator[${this.resource}]: Session ended`);

        this.launcher.debug.print(`Communicator[${this.resource}]: There will be try of restart connection to obtain new session (at the moment I'm only testing this solution).`);
        this.launcher.debug.print(`Communicator[${this.resource}]: Trying restart connection to obtain new session...`);
        
        await this.disconnect();
        this.stream.connect();

      });
      
      this.stream.once('session:started', async () => {

        this.emit('session:started');

        this.launcher.debug.print(`Communicator[${this.resource}]: Session started`);

        await this.refreshFriendsList();
        await this.updateStatus();

        resolve();
      });
      
      this.stream.once('session:bound', () => {

        this.emit('session:bound');

        this.launcher.debug.print(`Communicator[${this.resource}]: Session bounded`);
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

        this.launcher.debug.print(`Communicator[${this.resource}]: Disconnected`);
        
        resolve();

      });


    });
  }

  listenFriendsList() {

    this.stream.on('iq', (stanza) => {
      
      if (stanza.roster && stanza.type === 'result') {

        const friends = stanza.roster.items ? stanza.roster.items.map(friend => ({
          accountId: friend.jid.local,
          jid: friend.jid,
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
      
      this.emit('friend:status', new Status(this, {
        accountId: stanza.from.local,
        jid: stanza.from,
        state,
        status: stanza.status,
      }));
      
    });

  }

  listenMessages() {

    this.stream.on('message', async (stanza) => {
      
      if (stanza.type === 'normal') {

        const body = JSON.parse(stanza.body);

        switch (body.type) {

          case 'com.epicgames.social.party.notification.v0.PING': {
            // TODO: code refactoring
            
            if (this.app.id !== body.ns) break;
            
            const { data } = await this.app.http.sendGet(
              `https://party-service-prod.ol.epicgames.com/party/api/v1/${this.app.id}/user/${this.app.launcher.account.id}`,
            );
            
            let invitation = data.invites.find(invite => invite.sent_by === body.pinger_id && invite.status === 'SENT');

            if (!invitation) {
              this.launcher.debug.print('Fortnite: Cannot join into the party. Reason: No active invitation');
              break;
            }

            if (
              typeof invitation.meta !== 'object'
              || typeof invitation.meta['urn:epic:cfg:build-id_s'] !== 'string'
              || invitation.meta['urn:epic:cfg:build-id_s'] !== this.app.config.partyBuildId
            ) {
              this.launcher.debug.print('Fortnite: Cannot join into the party. Reason: Incompatible build id.');
              break;
            }

            const party = await this.app.Party.lookup(this.app, invitation.party_id);
            invitation = new this.app.PartyInvitation(party, invitation);

            this.emit('party:invitation', invitation);
            this.emit(`party#${party.id}:invitation`, invitation);
            this.emit(`party#${party.id}:invitation#${body.pinger_id}`, invitation);

          } break;

          case 'com.epicgames.social.party.notification.v0.MEMBER_LEFT': {

            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;
            
            const member = this.app.party.findMember(body.account_id);
            if (!member) break;
            this.app.party.removeMember(member);

            this.emit('party:member:left', member);
            this.emit(`party#${this.app.party.id}:member:left`, member);
            this.emit(`party#${this.app.party.id}:member#${member.id}:left`, member);

          } break;

          case 'com.epicgames.social.party.notification.v0.MEMBER_EXPIRED': {

            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;

            const member = this.app.party.findMember(body.account_id);
            if (!member) break;
            this.app.party.removeMember(member);

            this.emit('party:member:expired', member);
            this.emit(`party#${this.app.party.id}:member:expired`, member);
            this.emit(`party#${this.app.party.id}:member#${member.id}:expired`, member);

          } break;

          case 'com.epicgames.social.party.notification.v0.MEMBER_NEW_CAPTAIN': {

            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;

            const member = this.app.party.findMember(body.account_id);
            if (!member) break;
            this.app.party.members.forEach((m) => {
              m.role = null;
            });
            member.role = 'CAPTAIN';

            this.emit('party:member:promoted', member);
            this.emit(`party#${this.app.party.id}:member:promoted`, member);
            this.emit(`party#${this.app.party.id}:member#${member.id}:promoted`, member);

          } break;

          case 'com.epicgames.social.party.notification.v0.MEMBER_KICKED': {

            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;

            const member = this.app.party.findMember(body.account_id);
            if (!member) break;
            this.app.party.removeMember(member);

            if (member.id === this.app.launcher.account.id) {
              this.app.party = await this.app.Party.create(this.app);
            }

            this.emit('party:member:kicked', member);
            this.emit(`party#${this.app.party.id}:member:kicked`, member);
            this.emit(`party#${this.app.party.id}:member#${member.id}:kicked`, member);

          } break;

          case 'com.epicgames.social.party.notification.v0.MEMBER_DISCONNECTED': {

            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;

            const member = this.app.party.findMember(body.account_id);
            if (!member) break;
            this.app.party.removeMember(member);

            this.emit('party:member:disconnected', member);
            this.emit(`party#${this.app.party.id}:member:disconnected`, member);
            this.emit(`party#${this.app.party.id}:member#${member.id}:disconnected`, member);

          } break;

          case 'com.epicgames.social.party.notification.v0.PARTY_UPDATED':

            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;
            
            this.app.party.update(body, true);

            this.emit('party:updated', this.app.party);
            this.emit(`party#${this.app.party.id}:updated`, this.app.party);

            break;

          case 'com.epicgames.social.party.notification.v0.MEMBER_STATE_UPDATED': {
            
            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;
            
            const member = this.app.party.findMember(body.account_id);
            if (!member) break;

            member.update(body, true);

            this.emit('party:member:state:updated', member);
            this.emit(`party#${this.app.party.id}:member:state:updated`, member);
            this.emit(`party#${this.app.party.id}:member#${member.id}:state:updated`, member);

          } break;

          case 'com.epicgames.social.party.notification.v0.MEMBER_JOINED': {

            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;
            
            let member = this.app.party.findMember(body.account_id);
            if (!member) {
              member = new this.app.PartyMember(this.app.party, body);
              this.app.party.addMember(member);
            }
            await this.app.party.me.patch();

            this.emit('party:member:joined', member);
            this.emit(`party#${this.app.party.id}:member:joined`, member);
            this.emit(`party#${this.app.party.id}:member${member.id}:joined`, member);

          } break;

          case 'com.epicgames.social.party.notification.v0.MEMBER_REQUIRE_CONFIRMATION': {

            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;

            const confirmation = new this.app.PartyMemberConfirmation(this.app.party, {
              connection: body.connection,
              revision: body.revision,
              accountId: body.account_id,
              accountName: body.account_dn,
              jid: stanza.from,
              time: new Date(body.sent),
            });

            const doConfirm = this.app.config.partyMemberConfirmation;
            if (
              (typeof doConfirm === 'boolean' && doConfirm)
              || (typeof doConfirm === 'function' && doConfirm(confirmation))
            ) confirmation.confirm();

            this.emit('party:member:confirmation', confirmation);
            this.emit(`party#${this.app.party.id}:member:confirmation`, confirmation);
            this.emit(`party#${this.app.party.id}:member#${confirmation.member.id}:confirmation`, confirmation);

          } break;

          case 'com.epicgames.social.party.notification.v0.INITIAL_INVITE':

            if (this.app.id !== body.ns) break;

            // This event probably is deprecated!
            this.launcher.debug.print('Fortnite: Debug: INITIAL_INVITE');

            // const party = await this.app.Party.lookup(this.app, body.party_id);
            // const invitation = new this.app.PartyInvitation(party, {
            //   appId: body.ns,
            //   meta: body.meta,
            //   accountId: body.inviter_id,
            //   accountName: body.inviter_dn,
            //   jid: stanza.from,
            //   time: new Date(body.sent),
            // });

            // this.emit('party:invitation', invitation);
            // this.emit(`party#${party.id}:invitation`, invitation);
            // this.emit(`party#${party.id}:invitation#${body.invitee_id}`, invitation);

            break;

          case 'com.epicgames.social.party.notification.v0.INVITE_CANCELLED':

            if (this.app.id === 'Launcher') break;

            this.emit('party:invitation:canceled');
            this.emit(`party#${body.party_id}:invitation:canceled`);
            this.emit(`party#${body.party_id}:invitation#${body.invitee_id}:canceled`);

            break;

          case 'com.epicgames.social.party.notification.v0.INVITE_DECLINED':

            if (this.app.id === 'Launcher') break;

            this.emit('party:invitation:declined');
            this.emit(`party#${body.party_id}:invitation#${body.invitee_id}:declined`);

            break;

          case 'FRIENDSHIP_REMOVE':
            this.emit('friend:removed', new Friend(this.launcher, {
              accountId: body.from,
              status: 'REMOVED',
              time: new Date(body.timestamp),
              reason: body.reason,
            }));
            break;

          case 'FRIENDSHIP_REQUEST':
            
            if (body.status === 'ACCEPTED') {
              
              this.emit('friend:added', new Friend(this.launcher, {
                accountId: body.to,
                status: body.status,
                time: new Date(body.timestamp),
              }));

            } else {

              this.emit('friend:request', new FriendRequest(this.launcher, {
                accountId: this.launcher.account.id === body.from ? body.to : body.from,
                direction: this.launcher.account.id === body.from ? 'OUTGOING' : 'INCOMING',
                status: body.status,
                time: new Date(body.timestamp),
              }));

            }
            break;

          default:
            this.launcher.debug.print(`Communicator[${this.resource}]: Unexpected \`message\` type: ${body.type}`);
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

        this.launcher.debug.print(`Communicator[${this.resource}]: Stanza error!`);
        // eslint-disable-next-line no-console
        console.dir(stanza);
        
      } else {

        this.launcher.debug.print(`Communicator[${this.resource}]: Unknown stanza type!`);
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
    
    return this.stream.sendPresence({
      status: JSON.stringify(typeof status === 'object' ? status : { Status: status }),
    });
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
