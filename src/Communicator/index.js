const { JID, createClient: XMPPClient } = require('stanza.io');
const EventEmitter = require('events');
const UUID = require('uuid/v4');

const EUserState = require('../../enums/UserState');

const Friend = require('../Friend');
const FriendRequest = require('../FriendRequest');
const FriendMessage = require('./FriendMessage');

const Party = require('../Party');
const PartyInvitation = require('../Party/PartyInvitation');
const Member = require('../Party/Member');
const PartyMemberConfirmation = require('../Party/MemberConfimation');

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

    this.stream.on('message', async (stanza) => {
      
      if (stanza.type === 'normal') {

        const body = JSON.parse(stanza.body);

        switch (body.type) {

          case 'com.epicgames.social.party.notification.v0.MEMBER_LEFT': {

            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;

            const member = this.app.party.findMember(body.account_id);
            if (!member) break;
            this.app.party.removeMember(member);

            this.emit('party:member:left', member);
            this.emit(`party#${this.app.party.id}:member:left`, member);

          } break;

          case 'com.epicgames.social.party.notification.v0.MEMBER_NEW_CAPTAIN': {

            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;

            const member = this.app.party.findMember(body.account_id);
            if (!member) break;
            member.role = 'CAPTAIN';

            this.emit('party:member:promoted', member);
            this.emit(`party#${this.app.party.id}:member:promoted`, member);

          } break;

          case 'com.epicgames.social.party.notification.v0.MEMBER_KICKED': {

            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;

            const member = this.app.party.findMember(body.account_id);
            if (!member) break;
            this.app.party.removeMember(member);

            if (member.id === this.app.launcher.account.id) {
              this.app.party = await Party.create(this.app);
            }

            this.emit('party:member:kicked', member);
            this.emit(`party#${this.app.party.id}:member:kicked`, member);

          } break;

          case 'com.epicgames.social.party.notification.v0.PARTY_UPDATED':

            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;
            
            this.app.party.update(body, true);

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

            const member = new Member(this.app.party, body);
            this.app.party.addMember(member);

            this.emit('party:member:joined', member);
            this.emit(`party#${this.app.party.id}:member:joined`, member);

          } break;

          case 'com.epicgames.social.party.notification.v0.MEMBER_REQUIRE_CONFIRMATION': {

            if (this.app.id === 'Launcher') break;
            if (!this.app.party || this.app.party.id !== body.party_id) break;

            const payload = {
              connection: body.connection,
              revision: body.revision,
              accountId: body.account_id,
              accountName: body.account_dn,
              jid: stanza.from,
              time: new Date(body.sent),
            };

            const confirmation = new PartyMemberConfirmation(this.app.party, payload);
            confirmation.confirm();

          } break;

          case 'com.epicgames.social.party.notification.v0.INITIAL_INVITE': {

            if (this.app.id === 'Launcher') break;

            const party = await Party.lookup(this.app, body.party_id);
            const invitation = new PartyInvitation(party, {
              appId: body.ns,
              meta: body.meta,
              accountId: body.inviter_id,
              accountName: body.inviter_dn,
              jid: stanza.from,
              time: new Date(body.sent),
            });

            this.emit('party:invitation', invitation);
            this.emit(`party#${party.id}:invitation`, invitation);
            this.emit(`party#${party.id}:invitation#${body.invitee_id}`, invitation);

          } break;

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
