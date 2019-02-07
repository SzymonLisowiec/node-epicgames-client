const StanzaIO = require('stanza.io');
const EventEmitter = require('events');
const UUID = require('uuid/v4');

const EUserState = require('../../enums/UserState');

const User = require('../User');
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

	constructor (app, host, url, resource) {
		super();
		
		this.app = app;

		if(this.app.app_xmpp_name === 'launcher')
			this.client = this.app;
		else this.client = this.app.launcher;
		
		this.resource = resource === false ? false : 'V2:' + this.app.app_xmpp_name + ':WIN::' + this.generateUUID();
		this.host = host || 'prod.ol.epicgames.com';
		this.url = url || 'xmpp-service-prod.ol.epicgames.com';

	}

	generateUUID () {
		return UUID().replace(/\-/g, '').toUpperCase();
	}

	makeJID (...args) {
		return new StanzaIO.JID(...args);
	}

	static get PartyJoinRequest () { return PartyJoinRequest; }
	static get PartyJoinRequestApproved () { return PartyJoinRequestApproved; }
	static get PartyJoinAcknowledged () { return PartyJoinAcknowledged; }
	static get PartyData () { return PartyData; }
	static get PartyMemberData () { return PartyMemberData; }
	static get PartyQueryJoinability () { return PartyQueryJoinability; }
	static get PartyQueryJoinabilityResponse () { return PartyQueryJoinabilityResponse; }

	getClient () {
		return this.client;
	}

	async makeParty () { // EXPERIMENTAL

		let party = new Party(this, {
			party_id: this.generateUUID(),
			party_type_id: 286331153,
			access_key: this.generateUUID(),
			party_flags: 6,
			not_accepting_member_reason: 0,
			max_members: 4,
			password: '',
			presence_permissions: 1904481024,
			invite_permissions: 32512,
			leader: this.client.account.id,
			app_id: 'Fortnite',
			build_id: 4691381,
			members: [
				new User(this.client, {
					account_id: this.client.account.id,
					display_name: this.client.account.display_name,
					jid: this.stream.jid
				})
			]
		});

		party.runListeners();

		let properties = {};

		properties['party.joininfodata.' + party.type_id + '_j'] = {
			sourceId: this.client.account.id,
			sourceDisplayName: this.client.account.display_name,
			sourcePlatform: 'WIN',
			partyId: party.id,
			partyTypeId: party.type_id,
			key: party.access_key,
			appId: party.app_id,
			buildId: party.build_id.toString(),
			partyFlags: party.flags,
			notAcceptingReason: party.not_accepting_member_reason
		};

		properties = Object.assign(properties, {
			FortBasicInfo_j: {
				homeBaseRating: 1
			},
			FortLFG_I: '0',
			FortPartySize_i: 1,
			FortSubGame_i: 1,
			InUnjoinableMatch_b: false
		});

		await this.updateStatus({
			status: JSON.stringify({
				Status: 'Lobby Battle Royale - ' + party.members.length + ' / ' + party.max_members,
				bIsPlaying: false,
				bIsJoinable: true,
				bHasVoiceSupport: false,
				SessionId: '',
				Properties: properties
			})
		});

		this.party = party;

		return party;
	}

	connect (auth_token) {
		return new Promise((resolve, reject) => {

			this.stream = new StanzaIO.createClient({

				wsURL: 'wss://' + this.url,
				transport: 'websocket',
				server: this.host,
	
				credentials: {
					jid: this.client.account.id + '@' + this.host,
					host: this.host,
					username: this.client.account.id,
					password: auth_token || this.client.account.auth.access_token
				},

				resource: this.resource
				
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

				this.client.debug.print('Communicator[' + this.resource + ']: Connected');

			});

			this.stream.once('disconnected', async _ => {

				this.emit('disconnected');

				this.client.debug.print('Communicator[' + this.resource + ']: Disconnected');
				this.client.debug.print('Communicator[' + this.resource + ']: Trying reconnect...');

				await this.disconnect(true);
				this.stream.connect();

			});

			this.stream.once('session:end', async _ => {

				this.emit('session:ended');

				this.client.debug.print('Communicator[' + this.resource + ']: Session ended');

				this.client.debug.print('Communicator[' + this.resource + ']: There will be try of restart connection to obtain new session (at the moment I\'m only testing this solution).');
				this.client.debug.print('Communicator[' + this.resource + ']: Trying restart connection to obtain new session...');
				
				await this.disconnect();
				this.stream.connect();

			});
			
			this.stream.once('session:started', _ => {

				this.emit('session:started');

				this.client.debug.print('Communicator[' + this.resource + ']: Session started');

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

				this.client.debug.print('Communicator[' + this.resource + ']: Disconnected');
				
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
						this.client.debug.print('Communicator[' + this.resource + ']: Unexpected friend subscription in stanza `roster:update`: ' + stanza.type);
						break;

				}

			}

		});

	}

	listenFriendStates () {
		
		this.stream.on('presence', stanza => {
			
			let status = {};
			let app = {};

			try {
				if(stanza.status)
					status = JSON.parse(stanza.status);
			}catch(err){
				this.client.debug.print('Communicator[' + this.resource + ']: Cannot parse status\'s JSON for presentence. (' + stanza.status + ')');
			}

			try {
				app = stanza.from.resource.toLowerCase().split(':')[1];
			}catch(err){
				app = null;
			}

			const Status = require(this.app.library_name + '/src/Communicator/Status');
			
			this.emit('friend:status', new Status(this, {
				account_id: stanza.from.local,
				jid: stanza.from,
				state: stanza.type === 'available' ? stanza.show ? EUserState.Online : EUserState.Away : EUserState.Offline,
				app,
				status
			}));
			
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

					case 'com.epicgames.party.invitation': {

						let payload = {
							account_id: stanza.from.local,
							account_name: body.payload.displayName,
							jid: stanza.from,
							party_id: body.payload.partyId,
							party_type_id: body.payload.partyTypeId,
							access_key: body.payload.accessKey,
							app_id: body.payload.appId,
							build_id: body.payload.buildId,
							time: new Date(body.timestamp)
						};

						payload.party = new Party(this, payload);

						this.emit('party:invitation', new PartyInvitation(this, payload));
						this.emit('party#' + payload.party_id + ':invitation', new PartyInvitation(this, payload));

					} break;

					case 'com.epicgames.party.invitationresponse': {
						
						let payload = {
							account_id: stanza.from.local,
							account_name: body.payload.displayName,
							jid: stanza.from,
							party_id: body.payload.partyId,
							response: body.payload.response, // 2 = rejected
							time: new Date(body.timestamp)
						};

						this.emit('party:invitation:response', new PartyInvitationResponse(this, payload));
						this.emit('party#' + payload.party_id + ':invitation:response', new PartyInvitationResponse(this, payload));

					} break;

					case 'com.epicgames.party.joinrequest': {

						let payload = {
							account_id: stanza.from.local,
							jid: stanza.from,
							display_name: body.payload.displayName,
							party_id: body.payload.partyId,
							platform: body.payload.platform,
							accessKey: body.payload.accessKey,
							app_id: body.payload.appId,
							build_id: body.payload.buildId,
							time: new Date(body.timestamp)
						};

						this.emit('party:join:request', new PartyJoinRequest(this, payload));
						this.emit('party#' + payload.party_id + ':join:request', new PartyJoinRequest(this, payload));

					} break;

					case 'com.epicgames.party.joinrequest.approved': {

						let payload = {
							account_id: stanza.from.local,
							jid: stanza.from,
							party_id: body.payload.partyId,
							party_type_id: body.payload.partyTypeId,
							access_key: body.payload.accessKey,
							presence_permissions: body.payload.presencePermissions,
							invite_permissions: body.payload.invitePermissions,
							party_flags: body.payload.partyFlags,
							not_accepting_member_reason: body.payload.notAcceptingMembersReason,
							max_members: body.payload.maxMembers,
							password: body.payload.password,
							members: body.payload.members,
							time: new Date(body.timestamp)
						};

						this.emit('party:join:approved', new PartyJoinRequestApproved(this, payload));
						this.emit('party#' + payload.party_id + ':join:approved', new PartyJoinRequestApproved(this, payload));

					} break;

					case 'com.epicgames.party.updatepartyconfiguration': {

						let payload = {
							account_id: stanza.from.local,
							jid: stanza.from,
							party_id: body.payload.partyId,
							access_key: body.payload.accessKey,
							presence_permissions: body.payload.presencePermissions,
							invite_permissions: body.payload.invitePermissions,
							party_flags: body.payload.partyFlags,
							not_accepting_member_reason: body.payload.notAcceptingMembersReason,
							max_members: body.payload.maxMembers,
							password: body.payload.password,
							time: new Date(body.timestamp)
						};

						this.emit('party:updatepartyconfiguration', new PartyUpdateConfirmation(this, payload));
						this.emit('party#' + payload.party_id + ':updatepartyconfiguration', new PartyUpdateConfirmation(this, payload));

					} break;

					case 'com.epicgames.party.joinrequest.rejected': {

						let payload = {
							account_id: stanza.from.local,
							jid: stanza.from,
							party_id: body.payload.partyId,
							rejection_type: body.payload.rejectionType,
							result_param: body.payload.resultParam,
							time: new Date(body.timestamp)
						};

						this.emit('party:join:rejected', new PartyMemberJoined(this, payload));
						this.emit('party#' + payload.party_id + ':join:rejected', new PartyMemberJoined(this, payload));
					
					} break;

					case 'com.epicgames.party.memberjoined': {

						let payload = {
							account_id: stanza.from.local,
							jid: stanza.from,
							party_id: body.payload.partyId,
							member: body.payload.member,
							time: new Date(body.timestamp)
						};

						this.emit('party:member:joined', new PartyMemberJoined(this, payload));
						this.emit('party#' + payload.party_id + ':member:joined', new PartyMemberJoined(this, payload));

					} break;

					case 'com.epicgames.party.memberexited': {

						let payload = {
							account_id: stanza.from.local,
							jid: stanza.from,
							party_id: body.payload.partyId,
							member_id: body.payload.memberId,
							was_kicked: body.payload.wasKicked,
							time: new Date(body.timestamp)
						};

						this.emit('party:member:exited', new PartyMemberExited(this, payload));
						this.emit('party#' + payload.party_id + ':member:exited', new PartyMemberExited(this, payload));

					} break;

					case 'com.epicgames.party.memberpromoted': {

						let payload = {
							account_id: stanza.from.local,
							jid: stanza.from,
							party_id: body.payload.partyId,
							member: body.payload.promotedMemberUserId,
							leader_leaving: body.payload.fromLeaderLeaving,
							time: new Date(body.timestamp)
						}

						this.emit('party:member:promoted', new PartyMemberPromoted(this, payload));
						this.emit('party#' + payload.party_id + ':member:promoted', new PartyMemberPromoted(this, payload));

					} break;

					case 'com.epicgames.party.data': {

						let payload = {
							account_id: stanza.from.local,
							jid: stanza.from,
							party_id: body.payload.partyId,
							payload: body.payload.payload,
							time: new Date(body.timestamp)
						};

						this.emit('party:data', new PartyData(this, payload));
						this.emit('party#' + payload.party_id + ':data', new PartyData(this, payload));

					} break;

					case 'com.epicgames.party.memberdata': {

						let payload = {
							account_id: stanza.from.local,
							jid: stanza.from,
							party_id: body.payload.partyId,
							payload: body.payload.payload,
							time: new Date(body.timestamp)
						};

						this.emit('party:member:data', new PartyMemberData(this, payload));
						this.emit('party#' + payload.party_id + ':member:data', new PartyMemberData(this, payload));
						
					} break;

					case 'com.epicgames.party.queryjoinability': {

						let payload = {
							account_id: stanza.from.local,
							jid: stanza.from,
							party_id: body.payload.partyId,
							access_key: body.payload.accessKey,
							app_id: body.payload.appId,
							build_id: body.payload.buildId,
							join_data: body.payload.joinData,
							time: new Date(body.timestamp)
						};

						this.emit('party:query:joinability', new PartyQueryJoinability(this, payload));
						this.emit('party#' + payload.party_id + ':query:joinability', new PartyQueryJoinability(this, payload));

					} break;

					case 'com.epicgames.party.queryjoinability.response': {

						let payload = {
							account_id: stanza.from.local,
							jid: stanza.from,
							party_id: body.payload.partyId,
							is_joinable: body.payload.isJoinable,
							rejection_type: body.payload.rejectionType,
							result_param: body.payload.resultParam,
							time: new Date(body.timestamp)
						};

						this.emit('party:queryjoinability:response', new PartyQueryJoinabilityResponse(this, payload));
						this.emit('party#' + payload.party_id + ':queryjoinability:response', new PartyQueryJoinabilityResponse(this, payload));
						
					} break;

					case 'com.epicgames.party.joinacknowledged': {
						
						let payload = {
							account_id: stanza.from.local,
							jid: stanza.from,
							party_id: body.payload.partyId,
							time: new Date(body.timestamp)
						};

						this.emit('party:joinacknowledged', new PartyJoinAcknowledged(this, payload));
						this.emit('party#' + payload.party_id + ':joinacknowledged', new PartyJoinAcknowledged(this, payload));

					} break;

					case 'com.epicgames.party.joinacknowledged.response': {
						
						let payload = {
							account_id: stanza.from.local,
							jid: stanza.from,
							party_id: body.payload.partyId,
							time: new Date(body.timestamp)
						};

						this.emit('party:joinacknowledged:response', new PartyJoinAcknowledgedResponse(this, payload));
						this.emit('party#' + payload.party_id + ':joinacknowledged:response', new PartyJoinAcknowledgedResponse(this, payload));

					} break;

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
						this.client.debug.print('Communicator[' + this.resource + ']: Unexpected `message` type: ' + body.type);
						break;

				}

			}else if(stanza.type == 'chat') {
				
				this.emit('friend:message', new FriendMessage(this, {
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

		to = to + '@' + this.host;

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
