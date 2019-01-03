const ENDPOINT = require('../../resources/Endpoint');

const Cheerio = require('cheerio');

class AccountAuth {

	constructor (client) {
		
		this.client = client;
		this.token_timeout = null;
		
	}

	async auth () {
		
		try {

			/**
			 * Geting XSRF TOKEN
			 */
			let xsrf_token = await this.getXSRF();

			if(!xsrf_token)
				throw '[Account Authorization] Cannot get XSRF TOKEN!';


			/**
			 * Sending login form
			 */
			let { data } = await this.client.http.sendPost(ENDPOINT.LOGIN_FRONTEND + '/login/doLauncherLogin', 'launcher', {
				fromForm: 'yes',
				authType: null,
				linkExtAuth: null,
				client_id: this.client.auth.client_id,
				redirectUrl: ENDPOINT.LOGIN_FRONTEND + '/login/showPleaseWait?client_id=' + this.client.auth.client_id + '&rememberEmail=false',
				epic_username: this.client.config.email,
				password: this.client.config.password,
				rememberMe: 'NO'
			}, true, {
				'X-XSRF-TOKEN': xsrf_token
			});
			
			if(!data || !data.redirectURL){

				let $ = Cheerio.load(data);
				let error_codes_element = $('.errorCodes');

				if(error_codes_element.length > 0){

					let error_msg = error_codes_element.text().trim();

					console.log('Login form error: ' + error_msg);
					throw '[Account Authorization] Login form error: ' + error_msg;
				}

				throw '[Account Authorization] Cannot get "please wait" redirection URL!';
			}
			

			/**
			 * Reading exchange code from redirected "please wait" page
			 */
			let exchange_code = await this.getExchangeCode(data.redirectURL);

			if(!exchange_code)
				throw '[Account Authorization] Cannot get exchange code!';
			
			
			/**
			 * Exchanging code on token "eg1"
			 */
			let auth_data = await this.exchangeCode(exchange_code);
			
			if(!auth_data)
				throw '[Account Authorization] Cannot exchange code and receive auth_data!';

			
			/**
			 * Ending auth process
			 */

			this.setAuthParams(auth_data);
			this.setTokenTimeout();

			return true;

		}catch(err){

			this.client.debug.print(new Error(err));

		}

		return false;
	}

	async getXSRF() {
		
		await this.client.http.sendGet(ENDPOINT.LOGIN_FRONTEND + '/login/doLauncherLogin?client_id=' + this.client.auth.client_id + '&redirectUrl=https%3A%2F%2Faccounts.launcher-website-prod07.ol.epicgames.com%2Flogin%2FshowPleaseWait%3Fclient_id%3D' + this.client.auth.client_id + '%26rememberEmail%3Dfalse', 'launcher');

		let xsrf_token_cookie = this.client.http.jar.getCookies(ENDPOINT.LOGIN_FRONTEND + '/login/doLauncherLogin').find(cookie => {
			return cookie.key == 'XSRF-TOKEN';
		});

		return xsrf_token_cookie.value;
	}

	async getExchangeCode (url) {
		
		let { response: { body } } = await this.client.http.sendGet(url, 'launcher', {}, false);
		
		let regex = /com\.epicgames\.account\.web\.widgets\.loginWithExchangeCode\(\'(.*)\'(.*?)\)/g;
		let matches = regex.exec(body);

		return matches[1] || false;
	}

	async exchangeCode (exchange_code) {

		let { data } = await this.client.http.sendPost(ENDPOINT.OAUTH_TOKEN, 'launcher', {
			grant_type: 'exchange_code',
			exchange_code,
			token_type: 'eg1',
			includePerms: false // Account's permissions
		});
		
		return data || false;
	}

	async exchange () {
		
		try {
			
			let { data } = await this.client.http.sendGet(
				ENDPOINT.OAUTH_EXCHANGE,
				this.token_type + ' ' + this.access_token
			);
				
			if(data){
				
				return data;
		
			}

		}catch(err){
			
			this.client.debug.print(new Error(err));

		}
		
		return false;
	}

	async refreshToken () {

		this.client.debug.print('Refreshing account\'s token...');

		try {

			let { data } = await this.client.http.sendPost(ENDPOINT.OAUTH_TOKEN, 'launcher', {
				grant_type: 'refresh_token',
				refresh_token: this.refresh_token,
				includePerms: false // Account's permissions
			});
			
			if(data){

				this.setAuthParams(data);
				this.setTokenTimeout();

				this.client.emit('access_token_refreshed');

				this.client.debug.print('Account\'s token refreshed.');
				
				if(this.client.communicator){
		
					await this.client.communicator.disconnect();
					await this.client.communicator.connect();
					
					this.client.debug.print('Communicator: Reconnected with new account\'s access token.');
		
				}

				return true;
		
			}

		}catch(err){

			this.client.debug.print(new Error(err));

		}

		return false;
	}

	setAuthParams (data) {

		this.access_token = data.access_token;
		this.expires_in = data.expires_in;
		this.expires_at = data.expires_at;
		this.token_type = data.token_type;
		this.refresh_token = data.refresh_token;
		this.refresh_expires = data.refresh_expires;
		this.refresh_expires_at = data.refresh_expires_at;
		this.account_id = data.account_id;
		this.client_id = data.client_id;
		this.internal_client = data.internal_client;
		this.client_service = data.client_service;
		this.lastPasswordValidation = data.lastPasswordValidation;
		this.app = data.app;
		this.in_app_id = data.in_app_id;

	}

	setTokenTimeout () {
		
		if(this.token_timeout)
			clearTimeout(this.token_timeout);

		this.token_timeout = setTimeout(_ => {
			this.refreshToken();
		}, ( this.expires_in - 180 ) * 1000);

	}

}

module.exports = AccountAuth;