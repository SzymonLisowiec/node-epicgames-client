const StanzaIO = require('stanza.io');
const EventEmitter = require('events');

const EUserState = require('../../enums/UserState');

const Friend = require('../Friend');
const FriendRequest = require('../FriendRequest');
const FriendMessage = require('../FriendMessage');

class Communicator extends EventEmitter {

	constructor (app) {
		super();
		
		this.app = app;

		if(this.app.app_xmpp_name === 'launcher')
			this.client = this.app;
		else this.client = this.app.launcher;

	}

	connect () {
		return new Promise((resolve, reject) => {

			this.stream = new StanzaIO.createClient({

				wsURL: 'wss://xmpp-service-prod.ol.epicgames.com',
				transport: 'websocket',
				server: 'prod.ol.epicgames.com',
	
				credentials: {
					jid: this.client.account.id + '@prod.ol.epicgames.com',
					host: 'prod.ol.epicgames.com',
					username: this.client.account.id,
					password: this.client.account.auth.access_token
				},

				resource: 'V2:launcher:WIN'
				
			});
	
			this.stream.enableKeepAlive({
				interval: 60
			});
			
			this.listenFriendsList();
			this.listenFriendActions();
			this.listenFriendStates();
			this.listenMessages();
	
			this.stream.on('raw:incoming', xml => {
				this.emit('raw:incoming', xml);
			});
	
			this.stream.on('raw:outgoing', xml => {
				this.emit('raw:outgoing', xml);
			});

			this.stream.once('connected', async _ => {

				this.emit('connected');

				this.client.debug.print('Communicator: Connected');

			});

			this.stream.once('disconnected', async _ => {

				this.emit('disconnected');

				this.client.debug.print('Communicator: Disconnected');
				this.client.debug.print('Communicator: Trying reconnect...');

				await this.disconnect(true);
				this.stream.connect();

			});

			this.stream.once('session:end', async _ => {

				this.emit('session:ended');

				this.client.debug.print('Communicator: Session ended');

				this.client.debug.print('Communicator: There will be try of restart connection to obtain new session (at the moment I\'m only testing this solution).');
				this.client.debug.print('Communicator: Trying restart connection to obtain new session...');
				
				await this.disconnect();
				this.stream.connect();

			});
			
			this.stream.once('session:started', _ => {

				this.emit('session:started');

				this.client.debug.print('Communicator: Session started');

				this.refreshFriendsList();
				this.updateStatus();

				resolve();
			});
			
			this.stream.connect();

		});
	}

	disconnect (already_disconected) {
		return new Promise((resolve, reject) => {
			
			this.stream.off('disconnected');
			this.stream.off('session:end');
			this.stream.off('session:started');

			if(typeof already_disconected != 'undefined' && already_disconected){
				resolve();
				return;
			}

			this.stream.disconnect();

			this.stream.once('disconnected', _ => {

				this.client.debug.print('Communicator: Disconnected');
				
				resolve();

			});


		});
	}

	listenFriendsList () {

		this.stream.on('iq', stanza => {
			
			if(stanza.roster && stanza.type == 'result'){

				let friends = [];

				for(let i in stanza.roster.items){

					let friend = stanza.roster.items[i];
					
					friends.push({
						account_id: friend.jid.local
					});

				}

				this.emit('friends', friends);

			}

		});

	}

	listenFriendActions () {

		this.stream.on('roster:update', stanza => {
			
			for(let i in stanza.roster.items){

				let friend = stanza.roster.items[i];
				let account_id = friend.jid.local;

				switch (friend.subscription) {

					case 'both':
						// this.emit('friend:added', { account_id });
						// Currently using message, see method: listenMessages
						break;

					case 'remove':
						// this.emit('friend:removed', { account_id });
						// Currently using message, see method: listenMessages
						break;

					default:
						this.client.debug.print('Communicator: Unexpected friend subscription in stanza `roster:update`: ' + stanza.type);
						break;

				}

			}

		});

	}

	listenFriendStates () {
		
		this.stream.on('presence', stanza => {
			
			switch (stanza.type) {

				case 'available':
					
					let payload = {
						state: stanza.show ? EUserState.Away : EUserState.Online,
						account_id: stanza.from.local
					};

					if(stanza.status){
						
						stanza.status = JSON.parse(stanza.status);
						
						let in_game = false;

						try {
							in_game = stanza.from.resource.toLowerCase().split(':')[1];
						}catch(err){
							in_game = null;
						}

						payload = Object.assign(payload, {
							status: stanza.status.Status,
							is_playing: stanza.status.bIsPlaying,
							is_joinable: stanza.status.bIsJoinable,
							has_voice_support: stanza.status.bHasVoiceSupport,
							session_id: stanza.status.SessionId,
							properties: stanza.status.Properties,
							in_game
						});

					}

					this.emit('friend:status', payload);

					break;

				case 'unavailable':
					this.emit('friend:status', {
						state: EUserState.Offline,
						account_id: stanza.from.local
					});
					break;

				default:
					this.client.debug.print('Communicator: Unexpected `presence` type: ' + stanza.type);
					break;

			}
			
		});

	}

	listenMessages () {

		this.stream.on('message', stanza => {
			
			if(stanza.type == 'normal'){

				let body = JSON.parse(stanza.body);

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

					case 'com.epicgames.party.invitation':
						this.emit('friend:party:invitation', {
							account_id: stanza.from.local,
							payload: body.payload,
							time: new Date(body.timestamp)
						});
						break;

					case 'com.epicgames.party.joinrequest':
						this.emit('friend:party:join-request', {
							account_id: stanza.from.local,
							payload: body.payload,
							time: new Date(body.timestamp)
						});
						break;

					case 'com.epicgames.party.queryjoinability':
						this.emit('friend:party:join-request', {
							account_id: stanza.from.local,
							payload: body.payload,
							time: new Date(body.timestamp)
						});
						break;

					case 'FRIENDSHIP_REMOVE':
						this.emit('friend:removed', new Friend(this.client, {
							account_id: body.from,
							status: 'REMOVED',
							time: new Date(body.timestamp),
							reason: body.reason
						}));
						break;

					case 'FRIENDSHIP_REQUEST':
						
						if(body.status == 'ACCEPTED'){
							
							this.emit('friend:added', new Friend(this.client, {
								account_id: body.to,
								status: body.status,
								time: new Date(body.timestamp)
							}));

						}else{

							this.emit('friend:request', new FriendRequest(this.client, {
								account_id: this.client.account.id == body.from ? body.to : body.from,
								direction: this.client.account.id == body.from ? 'OUTGOING' : 'INCOMING',
								status: body.status,
								time: new Date(body.timestamp)
							}));

						}
						break;

					default:
						this.client.debug.print('Communicator: Unexpected `message` type: ' + body.type);
						break;

				}

			}else if(stanza.type == 'chat') {
				
				this.emit('friend:message', new FriendMessage(this.client, {
					account_id: stanza.from.local,
					status: 'ACCEPTED', // status for Friend
					message: stanza.body,
					time: new Date()
				}));

			}else if(stanza.type == 'error'){

				console.dir(stanza);
				
			}else{

				console.log('Unknown stanza type!');
				console.dir(stanza);

			}

			
		});

	}

	sendMessage (to, message) {

		to = to + '@prod.ol.epicgames.com';

		this.sendRequest({
			to: new StanzaIO.JID(to),
			type: 'chat',
			body: message
		});

	}

	sendRequest (data) {
		this.stream.sendMessage(data);
	}

	refreshFriendsList () {
		this.stream.getRoster();
	}

	updateStatus (status) {
		
		if(!status)
			return this.stream.sendPresence(null);
		
		if(typeof status == 'string'){

			return this.stream.sendPresence({
				status: {
					status: status
				}
			});

		}else return this.stream.sendPresence(status);

		return false;
	}

}

module.exports = Communicator;
