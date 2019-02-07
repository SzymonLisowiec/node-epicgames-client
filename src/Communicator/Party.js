const User = require('../User');

const PartyQueryJoinability = require('./PartyQueryJoinability');
const PartyJoinRequest = require('./PartyJoinRequest');
const PartyJoinAcknowledged = require('./PartyJoinAcknowledged');
const PartyJoinAcknowledgedResponse = require('./PartyJoinAcknowledgedResponse');
const PartyMemberJoined = require('./PartyMemberJoined');
const PartyMemberExited = require('./PartyMemberExited');
const PartyMemberData = require('./PartyMemberData');
const PartyData = require('./PartyData');
const PartyInvitation = require('./PartyInvitation');
const PartyQueryJoinabilityResponse = require('./PartyQueryJoinabilityResponse');
const PartyJoinRequestApproved = require('./PartyJoinRequestApproved');

class Party {

	constructor (communicator, data, listen) {
		
		this.communicator = communicator;
		this.client = this.communicator.getClient();
		
		this.id = data.party_id;
		this.type_id = data.party_type_id;
		this.access_key = data.access_key;
		this.password = data.password || '';

		this.app_id = data.app_id || null;
		this.build_id = data.build_id || null;

		this.leader = data.leader || null;

		this.presence_permissions = data.presence_permissions || null;
		this.invite_permissions = data.invite_permissions || null;

		this.flags = data.party_flags || null;

		this.members = data.members || [];
		this.max_members = data.max_members || null;

		this.not_accepting_reason = data.not_accepting_reason;

		this.party_data = data.party_data || new PartyData(this.communicator, {
			account_id: this.client.account.id,
			display_name: this.client.account.display_name,
			party_id: this.id
		});

		this.member_data = data.member_data || new PartyMemberData(this.communicator, {
			account_id: this.client.account.id,
			display_name: this.client.account.display_name,
			party_id: this.id
		});

		if(listen)
			this.runListeners();

		this.chat = null;
		
	}

	runListeners () {
		this.listenPartyData();
		this.listenMemberData();
		this.listenQueryJoinability();
		this.listenJoinRequest();
		this.listenMemberJoined();
		this.listenMemberExited();
		this.listenMemberPromoted();
		this.listenJoinAcknowledged();
	}

	exit (kicked) {

		this.communicator.removeAllListeners('party#' + this.id + ':data');
		this.communicator.removeAllListeners('party#' + this.id + ':member:data');
		this.communicator.removeAllListeners('party#' + this.id + ':member:joined');
		this.communicator.removeAllListeners('party#' + this.id + ':member:exited');
		this.communicator.removeAllListeners('party#' + this.id + ':member:promoted');
		this.communicator.removeAllListeners('party#' + this.id + ':query:joinability');
		this.communicator.removeAllListeners('party#' + this.id + ':query:joinability:response');
		this.communicator.removeAllListeners('party#' + this.id + ':join:request');
		this.communicator.removeAllListeners('party#' + this.id + ':joinacknowledged');
		this.communicator.removeAllListeners('party#' + this.id + ':joinacknowledged:response');
		
		let member_exited = new PartyMemberExited(this.communicator, {
			account_id: this.client.account.id,
			display_name: this.client.account.display_name,
			jid: this.communicator.stream.jid,
			party_id: this.id,
			member_id: this.client.account.id,
			was_kicked: kicked ? true : false
		});

		this.members.forEach(member => {
			member_exited.send(member.jid);
		});

		let member = this.findMemberById(this.client.account.id);
		this.members.splice(this.members.indexOf(member), 1);

	}

	// async connectToChat () {

	// 	try {

	// 		console.dir('https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/game/v2/voice/' + this.client.account.id + '/join/' + this.id);
	// 		let { data } = await this.communicator.app.http.sendGet('https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/game/v2/voice/' + this.client.account.id + '/join/' + this.id);

	// 		this.chat = this.communicator.makeCommunicator(this.communicator.app, 'fnwp.vivox.com', 'fnwp.vivox.com', false);

	// 		this.chat.on('raw:outgoing', xml => {
	// 			console.log('Chat outgoing');
	// 			console.dir(xml);
	// 		});

	// 		this.chat.on('raw:incoming', xml => {
	// 			console.log('Chat incoming');
	// 			console.dir(xml);
	// 		});

	// 		this.chat.on('error', xml => {
	// 			console.log('Chat error');
	// 			console.dir(xml);
	// 		});

	// 		await this.chat.connect(data.token);

	// 	}catch(err){

	// 		console.dir(err);
	// 		this.client.debug.print(new Error('Cannot conntect to chat!'));

	// 	}

	// }

	findMemberById (id) {
		return this.members.find(member => {
			return member.id === id;
		});
	}
	
	invite(jid) {

		if(typeof jid == 'string')
			jid = this.communicator.makeJID(jid);
		
		if(!this.findMemberById(this.client.account.id))
			return;

		if(this.findMemberById(jid.local))
			return;

		let invite = new PartyInvitation(this.communicator, {
			party_id: this.id,
			party_type_id: this.type_id,
			display_name: this.client.account.display_name,
			account_id: this.client.account.id,
			access_key: this.access_key,
			app_id: this.app_id,
			build_id: this.build_id,
			party: this
		});
		
		invite.send(jid);
		
	}

	async askToJoin (jid) {

		if(typeof jid == 'string')
			jid = this.communicator.makeJID(jid);

		this.runListeners();

		this.client.debug.print('[Party#' + this.id + '] Asking to join');

		let query_joinability = new PartyQueryJoinability(this.communicator, {
			party_id: this.id,
			account_id: jid.local,
			access_key: this.access_key,
			app_id: this.app_id,
			build_id: this.build_id
		});

		await query_joinability.send(jid);
		let response = await this.waitForJoinabilityResponse();
		
		if(!response)
			return;

		await this.sendJoinRequest(response);
		let approve = await this.waitForApproveJoinRequest();

		this.presence_permissions = approve.presence_permissions;
		this.invite_permissions = approve.invite_permissions;
		this.max_members = approve.max_members;
		this.members = approve.members;
		this.password = approve.password;

		this.members.push(new User(this.client, {
			id: this.client.account.id,
			display_name: this.client.account.display_name,
			jid: this.communicator.stream.jid
		}));

		await this.sendJoinAcknowledged(approve);
		await this.waitForJoinAcknowledgedResponse();

		await this.waitForPartyData();

		this.client.party = this;

	}
	
	get party_state () { return this.party_data.party_state }
	get privacy_settings () { return this.party_data.privacy_settings }
	get allow_join_in_progress () { return this.party_data.allow_join_in_progress }
	get is_squad_fill () { return this.party_data.is_squad_fill }
	get party_is_joined_in_progress () { return this.party_data.party_is_joined_in_progress }
	get game_session_id () { return this.party_data.game_session_id }
	get game_session_key () { return this.party_data.game_session_key }
	get connection_started () { return this.party_data.connection_started }
	get matchmaking_result () { return this.party_data.matchmaking_result }
	get matchmaking_state () { return this.party_data.matchmaking_state }
	get playlist () { return this.party_data.playlist }

	async listenPartyData () {
		this.communicator.on('party#' + this.id + ':data', data => {
			this.party_data = data;
		});
	}

	async listenMemberData () {
		this.communicator.on('party#' + this.id + ':member:data', member_data => {

			

		});
	}

	async listenMemberPromoted () {
		this.communicator.on('party#' + this.id + ':member:promoted', promoted => {

			this.leader = promoted.member.id;

		});
	}

	async listenQueryJoinability () {
		
		this.communicator.on('party#' + this.id + ':query:joinability', query => {

			this.client.debug.print('[Party#' + this.id + '] Received joinability query from ' + query.sender.id + '!');

			if(this.leader === null)
				return;

			let response;

			if(this.leader === this.client.account.id){

				this.client.debug.print('[Party#' + this.id + '] You can join ' + query.sender.id + '!');

				response = new PartyQueryJoinabilityResponse(this.communicator, {
					party_id: this.id,
					account_id: this.client.account.id,
					display_name: this.client.account.display_name,
					is_joinable: true,
					rejection_type: 0,
					result_param: ''
				});

			}else{

				this.client.debug.print('[Party#' + this.id + '] I\'m not a leader, redirect ' + query.sender.id + ' to ' + this.leader + '!');

				response = new PartyQueryJoinabilityResponse(this.communicator, {
					party_id: this.id,
					account_id: this.client.account.id,
					display_name: this.client.account.display_name,
					is_joinable: false,
					rejection_type: 4,
					result_param: this.leader
				});

			}
	
			response.send(query.sender.jid);

		});

	}

	async listenJoinRequest () {

		this.communicator.on('party#' + this.id + ':join:request', request => {

			if(this.leader != this.client.account.id)
				return;

			let approve = new PartyJoinRequestApproved(this.communicator, {
				party_id: this.id,
				party_type_id: this.type_id,
				account_id: this.client.account.id,
				display_name: this.client.account.display_name,
				access_key: this.access_key,
				presence_permissions: this.presence_permissions,
				invite_permissions: this.invite_permissions,
				party_flags: this.flags,
				not_accepting_member_reason: this.not_accepting_member_reason,
				max_members: this.max_members,
				password: this.password,
				members: this.members.map(member => {
					return {
						id: member.id,
						display_name: member.display_name,
						xmppResource: member.jid.resource
					};
				})
			});
	
			approve.send(request.sender.jid);
			
			let member_joined = new PartyMemberJoined(this.communicator, {
				party_id: this.id,
				account_id: this.client.account.id,
				display_name: this.client.account.display_name,
				member: {
					account_id: request.sender.jid.local,
					display_name: request.sender.display_name,
					xmppResource: request.sender.jid.resource
				}
			});

			this.members.push(new User(this.client, {
				id: request.sender.jid.local,
				display_name: request.sender.display_name,
				jid: request.sender.jid
			}));
			
			this.members.forEach(member => {
				member_joined.send(member.jid);
			});

		});

	}

	listenMemberJoined () {

		this.communicator.on('party#' + this.id + ':member:joined', joined => {

			if(this.client.account.id == joined.member.id){
				
				this.members.forEach(member => {
					this.member_data.send(member.jid);
				});

			}else{

				this.member_data.send(joined.member.jid);

			}

		});
		
	}

	listenMemberExited () {
		
		this.communicator.on('party#' + this.id + ':member:exited', exited => {

			
			if(exited.member.id == this.client.account.id){
				this.exit(exited.was_kicked);
				return;
			}

			let member = this.findMemberById(exited.member.id);
			this.members.splice(this.members.indexOf(member), 1);

		});

	}

	async listenJoinAcknowledged (join_acknowledged) {

		this.communicator.on('party#' + this.id + ':joinacknowledged', async join_acknowledged => {

			let join_acknowledged_response = new PartyJoinAcknowledgedResponse(this.communicator, {
				account_id: this.client.account.id,
				display_name: this.client.account.display_name,
				party_id: this.id
			});

			await join_acknowledged_response.send(join_acknowledged.sender.jid);

		});

	}

	waitForJoinabilityResponse () {

		return new Promise((resolve, reject) => {
			
			this.communicator.once('party#' + this.id + ':queryjoinability:response', async response => {

				if(!response.is_joinable){

					switch (response.rejection_type) {

						case 4: {

							let leader_jid = response.result_param + '@prod.ol.epicgames.com';

							this.client.debug.print('[Party#' + this.id + '] Asked jid isn\'t leader, redirecting to leader: ' + leader_jid);

							resolve(this.askToJoin(leader_jid));
							
						} break;

						case 7: {
							this.client.debug.print('[Party#' + this.id + '] Cannot join into party. Reason: You are already in party.');
							resolve(false);
						} break;

						default: {

							this.client.debug.print('[Party#' + this.id + '] Cannot join into party. Rejection type: ' + response.rejection_type);
							resolve(false);

						} break;

					}

					return;
				}

				resolve(response);

			});

			setTimeout(_ => {
				reject('No response on queryjoinability in 4 sec.');
			}, 4000);

		});
	}

	async sendJoinRequest (response) {

		this.client.debug.print('[Party#' + this.id + '] Sending join request...');

		let join_request = new PartyJoinRequest(this.communicator, {
			party_id: this.id,
			account_id: this.client.account.id,
			display_name: this.client.account.display_name,
			platform: 'WIN',
			access_key: this.access_key,
			app_id: this.app_id,
			build_id: this.build_id,
			join_data: {
				Rev: 0,
				Attrs: {
					CrossplayPreference_i: 1
				}
			}
		});

		await join_request.send(response.sender.jid);

	}

	waitForApproveJoinRequest () {
		return new Promise((resolve, reject) => {
			
			this.communicator.once('party#' + this.id + ':join:approved', async approve => {
				
				this.client.debug.print('[Party#' + this.id + '] Join request has approved!');
				resolve(approve);

			});

			setTimeout(_ => {
				reject('Join reuqest hasn\'t approved in 4 sec.');
			}, 4000);

		});
	}

	async sendJoinAcknowledged (approve) {

		this.client.debug.print('[Party#' + this.id + '] Sending join acknowledged...');

		let joinacknowledged = new PartyJoinAcknowledged(this.communicator, {
			account_id: this.client.account.id,
			display_name: this.client.account.display_name,
			party_id: this.id
		});

		await joinacknowledged.send(approve.sender.jid);

		this.leader = approve.sender.jid.local;

	}

	waitForJoinAcknowledgedResponse () {
		return new Promise((resolve, reject) => {
			
			this.communicator.once('party#' + this.id + ':joinacknowledged:response', async response => {
				
				this.client.debug.print('[Party#' + this.id + '] Received join acknowledged response!');
				resolve(response);

			});

			setTimeout(_ => {
				reject('Join aknowledged response hasn\'t received in 4 sec.');
			}, 4000);
			
		});
	}

	waitForPartyData () {
		return new Promise((resolve, reject) => {
			
			setInterval(_ => {
				
				if(this.party_data)
					resolve(true);

			}, 100);

			setTimeout(_ => {
				reject('Not received party\'s data in 4 sec.');
			}, 4000);
			
		});
	}

}

module.exports = Party;