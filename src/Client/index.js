const ENDPOINT = require('../../resources/ENDPOINT');

const Events = require('events');
const request = require('request');
const Http = require('../Http');
const WaitingRoom = require('../WaitingRoom');
const Account = require('../Account');
const Auth = require('./Auth');
const Debug = require('../Debug');

class Client extends Events {

	constructor (config) {
		super(config);

		this.config = Object.assign({
			
			email: null,
			password: null,
			http: {}

		}, config || {});

		this.debug = new Debug({
			tool: console.log
		});

		this.build = '7.6.0-3948288+++Portal+Release-Live'; //Build of Launcher
		this.ue_build = '4.18.0-3948288+++Portal+Release-Live'; //Build of Unreal Engine

		this.http = new Http(this);

		this.app_name = null;
		this.label_name = null;

		this.account = null;

		this.auth = null;
		
	}

	/**
	 * Client initialize
	 */
	async init () {
			
		try {

			let waiting_room = new WaitingRoom(ENDPOINT.WAITING_ROOM, this.http);

			if(await waiting_room.needWait()){
				//TODO: Show a time, which you have to wait.
			}else{
				
				this.auth = new Auth(this);
				let auth = await this.auth.auth();

				if(auth){

					this.debug.print('Successfully the client authentication.');
					this.debug.print('Client ID: ' + this.auth.client_id);

					let launcher_status = await this.getLauncherStatus();
					this.debug.print('Client status: ' + launcher_status);
						
					let launcher_info = await this.getLauncherInfo();

					if(launcher_info){

						this.build = launcher_info.buildVersion;
						this.app_name = launcher_info.appName;
						this.label_name = launcher_info.labelName;

						this.debug.print('Client build version: ' + this.build);
						this.debug.print('Client app name: ' + this.app_name);
						this.debug.print('Client label name: ' + this.label_name);

						this.debug.print('Client ready.');
						return true;

					}

				}

			}

		}catch(err){

			this.debug.print(new Error(err));

		}

		return false;
	}

	/**
	 * Loging to account.
	 * @return {boolean} True if success.
	 */
	async login () {

		this.account = new Account(this);
		let auth = await this.account.authorize();

		if(auth){

			this.debug.print('Account logged.');

			return true;
		}

		
		return false;
	}

	/**
	 * 
	 * @param {*} value 
	 */
	isID (value) {
		return value.length > 16; //temporary way
	}

	isUsername (value) {
		return value.length >= 3 && value.length <= 16; //temporary way
	}

	/**
	 * @return {array} Array of domains using by EpicGames
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
	 * Search user by username.
	 * @param {string} display_name
	 * @return {*} Array with `id` and `displayName` or false if user has been not found
	 */
	async lookup(display_name) {

		try {
			
			let { data } = await this.http.sendGet(
				ENDPOINT.ACCOUNT_BY_NAME + '/' + display_name,
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);

			return data;

		}catch(err){

			if(err != 'errors.com.epicgames.account.account_not_found')
				this.debug.print(new Error(err));

		}

		return false;
	} 

	/**
	 * List of friends.
	 * @param {boolean} include_pending - Do include pending friends
	 * @return array with friends
	 */
	async getFriends (include_pending) {

		try {
			
			let { data } = await this.http.sendGet(
				ENDPOINT.FRIENDS + '/' + this.account.id + '?includePending=' + (include_pending ? true : false),
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);

			return data === '' ? [] : data;

		}catch(err){

			this.debug.print('Cannot get friends list.');
			this.debug.print(new Error(err));

		}

		return [];
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
	 * @param {string} id - account's id or name
	 * @return {boolean}
	 */
	async blockFriend (id) {

		try {

			let id = null;
			
			if(this.isUsername(username)){

				let account = await this.lookup(username);
				if(account)
					id = account.id;
				else return false;

			}else id = username;

			let { data } = await this.http.sendPost(
				ENDPOINT.FRIENDS_BLOCKLIST + '/' + this.account.id + '/' + id,
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);

			return true;

		}catch(err){

			this.debug.print('Cannot block a friend.');
			this.debug.print(new Error(err));

		}

		return false;
	}

	/**
	 * Remove a friend.
	 * @param {string} id - account's id or name
	 * @return {boolean}
	 */
	async removeFriend (username) {

		try {

			let id = null;
			
			if(this.isUsername(username)){

				let account = await this.lookup(username);
				if(account)
					id = account.id;
				else return false;

			}else id = username;
			
			let { data } = await this.http.send(
				'DELETE',
				ENDPOINT.FRIENDS + '/' + this.account.id + '/' + id,
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);

			return true;

		}catch(err){

			this.debug.print('Cannot remove a friend.');
			this.debug.print(new Error(err));

		}

		return false;
	}

	/**
	 * Invite a new friend.
	 * @param {string} id - account's id or name
	 * 
	 */
	async inviteFriend (username) {
		
		try {
			
			let id = null;
			
			if(this.isUsername(username)){

				let account = await this.lookup(username);
				if(account)
					id = account.id;
				else return false;

			}else id = username;
				
			let { data } = await this.http.sendPost(
				ENDPOINT.FRIENDS + '/' + this.account.id + '/' + id,
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);

			return true;

		}catch(err){

			this.debug.print('Cannot invite friend.');
			this.debug.print(new Error(err));

		}

		return false;
	}

	/**
	 * List of recent players.
	 * @return array with recent players
	 */
	async getRecentPlayers () {

		try {
			
			let { data } = await this.http.sendGet(
				ENDPOINT.FRIENDS_RECENT_PLAYERS.replace('{{account_id}}', this.account.id),
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);

			return data === '' ? [] : data;

		}catch(err){

			this.debug.print('Cannot get list of recent players.');
			this.debug.print(new Error(err));

		}

		return [];
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

	async getLauncherInfo () {

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

}

module.exports = Client;