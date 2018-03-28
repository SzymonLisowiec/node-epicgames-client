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
	 * Loging to an account.
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

			return data;

		}catch(err){

			if(err != 'errors.com.epicgames.account.account_not_found')
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
	 * @param {string} id - account's id or display name
	 * @return {boolean}
	 */
	async blockFriend (id) {

		try {
			
			if(this.isDisplayName(id)){

				let account = await this.lookup(id);
				if(account)
					id = account.id;
				else return false;

			}

			let { data } = await this.http.sendPost(
				ENDPOINT.FRIENDS_BLOCKLIST + '/' + this.account.id + '/' + id,
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);

			return true;

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
			
			if(this.isDisplayName(id)){

				let account = await this.lookup(id);
				if(account)
					id = account.id;
				else return false;

			}
			
			let { data } = await this.http.send(
				'DELETE',
				ENDPOINT.FRIENDS + '/' + this.account.id + '/' + id,
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);

			return true;

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
			
			if(this.isDisplayName(id)){

				let account = await this.lookup(id);
				if(account)
					id = account.id;
				else return false;

			}
				
			let { data } = await this.http.sendPost(
				ENDPOINT.FRIENDS + '/' + this.account.id + '/' + id,
				this.account.auth.token_type + ' ' + this.account.auth.access_token
			);

			return true;

		}catch(err){

			this.debug.print(new Error(err));

		}

		return false;
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