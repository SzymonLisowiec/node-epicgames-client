const StanzaIO = require('stanza.io');
const EventEmitter = require('events');

const EUserState = require('../../enums/UserState');

class Communicator extends EventEmitter {

	constructor (client) {
		super(client);

		this.client = client;
		
		this.stream = new StanzaIO.createClient({

			wsURL: 'wss://xmpp-service-prod.ol.epicgames.com',
			transport: 'websocket',
			server: 'prod.ol.epicgames.com',

			credentials: {
				host: 'prod.ol.epicgames.com',
				username: this.client.account.id,
				password: this.client.account.auth.access_token
			}

		});

		// this.stream.on('raw:incoming', stanza => {
		// 	console.dir(stanza);
		// });
		
		this.listenFriendsList();
		this.listenFriendActions();
		this.listenFriendStates();
		this.listenMessages();

	}

	connect () {
		return new Promise((resolve, reject) => {
			
			this.stream.connect();

			this.stream.on('session:started', _ => {

				this.refreshFriendsList();
				this.updateStatus();

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
						this.emit('friend:removed', {
							account_id: body.from,
							status: body.status,
							time: new Date(body.timestamp),
							reason: body.reason
						});
						break;

					case 'FRIENDSHIP_REQUEST':

						if(body.status == 'ACCEPTED'){

							this.emit('friend:added', {
								account_id: body.to,
								status: body.status,
								time: new Date(body.timestamp)
							});

						}else{

							this.emit('friend:request', {
								account_id: body.from,
								status: body.status,
								time: new Date(body.timestamp)
							});

						}
						break;

					default:
						this.client.debug.print('Communicator: Unexpected `message` type: ' + body.type);
						break;

				}

			}else if(stanza.type == 'chat') {

				this.emit('friend:message', {
					account_id: stanza.from.local,
					message: stanza.body
				});

			}else if(stanza.type == 'error'){

				console.dir(stanza);
				
			}

			
		});

	}

	sendMessage (to, message) {
		this.stream.sendRequest({
			to,
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

		this.stream.sendPresence(status ? {
			status: {
				status: status
			}
		} : null);

	}

}

module.exports = Communicator;