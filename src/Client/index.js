const ENDPOINT = require('../../resources/Endpoint');

const Events = require('events');
const Http = require('../Http');
const WaitingRoom = require('../WaitingRoom');
const Account = require('../Account');
const Auth = require('./Auth');
const Debug = require('../Debug');
const Communicator = require('../Communicator');
const User = require('../User');
const Friend = require('../Friend');

class Client extends Events {

	constructor (config) {
		super(config);

		this.app_name = 'Launcher';
		this.app_xmpp_name = 'launcher';

		this.config = Object.assign({
			
			email: null,
			password: null,
			debug: null,
			use_waiting_room: true,

			http: {},

			backward_compatibility: false,

			language: 'en-EN'

		}, config || {});

		this.debug = new Debug({
			tool: this.config.debug
		});

		this.os = 'Windows/10.0.17134.1.768.64bit';
		this.build = '8.4.0-4627382+++Portal+Release-Live'; //Build of Launcher
		this.ue_build = '4.18.0-3948288+++Portal+Release-Live'; //Build of Unreal Engine

		this.http = new Http(this);
        this.http.setHeader('Accept-Language', this.config.language);

		this.app_name = null;
		this.label_name = null;

		this.account = null;
		this.communicator = null;

		this.auth = null;
		
	}

	/**
	 * Sets client language
	 */
	setLanguage (iso_language) {
		this.http.setHeader('Accept-Language', iso_language);
	}

	/**
	 * Client initialize
	 */
	async init () {
			
		try {

			let wait = false;
			if(this.config.use_waiting_room){
				let waiting_room = new WaitingRoom(ENDPOINT.WAITING_ROOM, this.http);
				wait = await waiting_room.needWait();
			}

			if(wait){
				
				this.debug.print('Problems with servers, need wait ' + wait.expected_wait + ' seconds.');
				let sto = setTimeout(_ => {
					clearTimeout(sto);
					return this.init();
				}, wait.expected_wait*1000);

			}else{
				
				this.auth = new Auth(this);
				let auth = await this.auth.auth();

				if(auth){

					this.debug.print('Successfully the client authentication.');
					this.debug.print('Client ID: ' + this.auth.client_id);

					await this.getLauncherStatus(); // only for simulate official launcher
					
					/**
					 * LAUNCHER INFO IS PROBABLY DEPRECATED
					 */
					// let launcher_info = await this.getLauncherInfo();

					// if(launcher_info){

					// 	this.build = launcher_info.buildVersion;
					// 	this.app_name = launcher_info.appName;
					// 	this.label_name = launcher_info.labelName;

					// 	this.debug.print('Client build version: ' + this.build);
					// 	this.debug.print('Client app name: ' + this.app_name);
					// 	this.debug.print('Client label name: ' + this.label_name);

					// 	this.debug.print('Client ready.');
					// 	return true;

					// }

					this.debug.print('Client ready.');
					return true;

				}

			}

		}catch(err){

			this.debug.print(new Error(err));

		}

		return false;
	}

	/**
	 * Loging to an account.
	 * @return {boolean} True if success.
	 */
	async login () {

		this.account = new Account(this);
		let auth = await this.account.authorize();

		if(auth){
			
			this.communicator = new Communicator(this);
			await this.communicator.connect();

			this.debug.print('Account logged.');

			return true;
		}

		
		return false;
	}

	/**
	 * Logouting
	 * @return {boolean} True if success.
	 */
	async logout () {

		let req = await this.http.send(
			'DELETE',
			ENDPOINT.OAUTH_SESSIONS_KILL + '/' + this.account.auth.access_token,
			this.account.auth.token_type + ' ' + this.account.auth.access_token
		);
		
		return true;
	}

	/**
	 * Checks if `value` is account's id.
	 * @param {string} value
	 * @return {boolean}
	 */
	isID (value) {
		return value.length > 16; //temporary way
	}

	/**
	 * Checks if `value` is account's display name.
	 * @param {string} value
	 * @return {boolean}
	 */
	isDisplayName (value) {
		return value.length >= 3 && value.length <= 16; //temporary way
	}

	/**
	 * Returns array of domains using by EpicGames.
	 * @return {array}
	 */
	async getEpicDomains() {

		try {
			
			let { data } = await this.http.sendGet(ENDPOINT.DOMAINS);

			return data;

		}catch(err){

			this.debug.print(new Error(err));

		}

		return false;
	} 

	/**
	 * @param {string} display_name - user's display name
	 * @return {*} Array with account's id, display name and extarnalAuths or `false` if user not found.
	 */
	async lookup(display_name) {

		try {
			
			let { data } = await this.http.sendGet(
				ENDPOINT.ACCOUNT_BY_NAME + '/' + display_name,
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);
			
			return this.config.backward_compatibility ? data : {
				id: data.id,
				account_name: data.displayName,
				external_auths: data.externalAuths
			};

		}catch(err){

			if(err != 'errors.com.epicgames.account.account_not_found')
				this.debug.print(new Error(err));

		}

		return false;
	}

	/**
	 * Get specyfic user profile
	 * @param {string} id - account's id or display name
	 * @return {boolean}
	 */
	async getProfile (id) {

		let accounts = await this.getProfiles([id]);

		if(accounts.length == 1)
			return accounts[0];

		return false;
	}

	/**
	 * Get users profiles
	 * @param {string} ids - array of account's id or display name
	 * @return {boolean}
	 */
	async getProfiles (ids) {

		let query_string = '';

		for(let i in ids){

			let id = ids[i];
			
			if(this.isDisplayName(id)){

				let account = await this.lookup(id);
				if(account)
					id = account.id;
					
			}

			query_string += '&accountId=' + id;

		}
		
		try {
			
			let { data } = await this.http.sendGet(
				ENDPOINT.ACCOUNT + '?' + query_string.substr(1),
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);
			
			return data.map(account => {
				return new User(this, {
					id: account.id,
					display_name: account.displayName,
					external_auths: account.externalAuths
				});
			});

		}catch(err){

			this.debug.print(new Error(err));

		}

		return false;
	}

	/**
	 * List of friends.
	 * @param {boolean} include_pending - whether including pending friends (invite requests)
	 * @return {array}
	 */
	async getFriends (include_pending) {

		try {
			
			let { data } = await this.http.sendGet(
				ENDPOINT.FRIENDS + '/' + this.account.id + '?includePending=' + (include_pending ? true : false),
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);
			
			if(data === '')
				return [];
			else return this.config.backward_compatibility ? data : data.map(account => {
				return new Friend(this, {
					account_id: account.accountId,
					status: account.status,
					direction: account.direction,
					created: new Date(account.created),
					favorite: account.favorite
				});
			});

		}catch(err){

			this.debug.print('Cannot get friends list.');
			this.debug.print(new Error(err));

		}

		return [];
	}
	
	/**
	 * List of pending friends.
	 * @return {array}
	 */
	async getPendingFriends () {
		let friends = await this.getFriends(true);

		return friends ? friends.filter(friend => friend.status === "PENDING") : [];
	}

	/**
	 * Verifying given account id or display name is our friend.
	 * @param {string} id - account's id or display name
	 * @return {boolean}
	 */
	async hasFriend (id) {

		try {
			
			let user = await User.get(this, id);

			if(!user)
				return false;

			let friends = await this.getFriends();
			
			return friends.findIndex(friend => {
				return friend.account_id == user.id;
			}) > -1 ? true : false;

		}catch(err){

			this.debug.print(new Error(err));

		}

		return false;
	}

	/**
	 * Blocklist of friends.
	 * @return {array} Array with blocked friends
	 */
	async getFriendsBlocklist () {

		try {
			
			let { data } = await this.http.sendGet(
				ENDPOINT.FRIENDS_BLOCKLIST + '/' + this.account.id,
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);

			return data === '' ? [] : data;

		}catch(err){

			this.debug.print('Cannot get blocked friends.');
			this.debug.print(new Error(err));

		}

		return [];
	}

	/**
	 * Block a friend.
	 * @param {string} id - account's id or display name
	 * @return {boolean}
	 */
	async blockFriend (id) {

		try {
			
			let user = await User.get(this, id);

			if(!user)
				return false;

			let { data } = await this.http.sendPost(
				ENDPOINT.FRIENDS_BLOCKLIST + '/' + this.account.id + '/' + user.id,
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);

			return new Friend(this, {
				id: user.id,
				display_name: user.display_name,
				status: 'BLOCKED',
				time: new Date()
			});

		}catch(err){

			this.debug.print(new Error(err));

		}

		return false;
	}

	/**
	 * Remove a friend.
	 * @param {string} id - account's id or display name
	 * @return {boolean}
	 */
	async removeFriend (id) {

		try {
			
			let user = await User.get(this, id);

			if(!user)
				return false;
			
			let { data } = await this.http.send(
				'DELETE',
				ENDPOINT.FRIENDS + '/' + this.account.id + '/' + user.id,
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);

			return new Friend(this, {
				id: user.id,
				display_name: user.display_name,
				status: 'REMOVED',
				time: new Date()
			});

		}catch(err){

			this.debug.print(new Error(err));

		}

		return false;
	}

	/**
	 * Invite a new friend.
	 * @param {string} id - account's id or display name
	 * @return {boolean}
	 */
	async inviteFriend (id) {
		
		try {
			
			let user = await User.get(this, id);

			if(!user)
				return false;
				
			await this.http.sendPost(
				ENDPOINT.FRIENDS + '/' + this.account.id + '/' + user.id,
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);
			
			return new Friend(this, {
				id: user.id,
				display_name: user.display_name,
				status: 'PENDING',
				time: new Date()
			});

		}catch(err){

			this.debug.print(new Error(err));

		}

		return false;
	}

	/**
	 * Accepting friend's invitation. Alias for method inviteFriend
	 * @param {string} id - account's id or display name
	 * @return {boolean}
	 */
	async acceptFriendRequest (id) {
		return this.inviteFriend(id);
	}

	/**
	 * Declining friend's invitation. Alias for method removeFriend
	 * @param {string} id - account's id or display name
	 * @return {boolean}
	 */
	async declineFriendRequest (id) {
		return this.removeFriend(id);
	}

	async getLauncherStatus () {
		
		try {

			let { data } = await this.http.sendGet(
				ENDPOINT.LAUNCHER_STATUS + '/' + this.build,
				this.auth.token_type + ' ' + this.auth.access_token
			);
			
			return data.status;

		}catch(err){

			this.debug.print('Cannot get launcher status.');
			this.debug.print(new Error(err));

		}

		return false;
	}

	async getLauncherInfo () { // PROBABLY DEPRECATED

		try {

			let { data } = await this.http.sendGet(
				ENDPOINT.LAUNCHER_INFO + '?label=Live&subLabel=Belica',
				this.auth.token_type + ' ' + this.auth.access_token
			);

			return data;

		}catch(err){

			this.debug.print('Cannot get launcher info.');
			this.debug.print(new Error(err));

		}

		return false;
	}

	async checkEULA (namespace) {
		
		try {
			
			let { data } = await this.http.sendGet(
				ENDPOINT.EULA_TRACKING.replace('{{namespace}}', namespace) + '/account/' + this.account.id + '?locale=' + this.http.getHeader('Accept-Language'),
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);
			
			return !data ? true : data;

		}catch(err){

			this.debug.print('Cannot get EULA for namespace ' + namespace);
			this.debug.print(new Error(err));

		}

		return false;
	}

	async acceptEULA (eula) {
		
		try {
			
			let { response } = await this.http.sendPost(
				ENDPOINT.EULA_TRACKING.replace('{{namespace}}', namespace) + '/version/' + version + '/account/' + this.account.id + '/accept?locale=' + locale,
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);
			
			return response.statusCode === 204;

		}catch(err){

			this.debug.print('Cannot accept EULA v' + version + ' for namespace ' + namespace);
			this.debug.print(new Error(err));

		}

		return false;
	}

	async runGame (game, options) {
		
		try {
			
			this.debug.print('Running game ' + game.Namespace);

			let eula = await this.checkEULA(game.Namespace);
			
			if(eula !== true){

				if(eula === false){
					
					throw new Error('Cannot get informations about EULA for game ' + game.Namespace + '!');

				}else{

					await this.acceptEULA(eula);
					eula = await this.checkEULA(eula);

				}

			}

			if(eula !== true)
				throw new Error('Cannot accept EULA for game ' + game.Namespace + '!');

			let game_client = new game.Client(this, options);

			if(!await game_client.init())
				throw new Error('Cannot initialize game ' + game.Namespace + '!');

			return game_client;

		}catch(err){

			this.debug.print('Cannot run game.');
			this.debug.print(new Error(err));

		}

		return false;
	}

}

module.exports = Client;