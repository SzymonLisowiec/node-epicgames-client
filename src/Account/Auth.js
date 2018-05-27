const ENDPOINT = require('../../resources/Endpoint');

class AccountAuth {

	constructor (client) {
		
		this.client = client;
		
	}

	async auth () {
		
		try {

			let { data } = await this.client.http.sendPost(ENDPOINT.OAUTH_TOKEN, 'launcher', {
				grant_type: 'password',
				username: this.client.config.email,
				password: this.client.config.password,
				token_type: 'eg1',
				includePerms: false // Account's permissions
			});
			
			if(data){

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

				return true;
		
			}

		}catch(err){

			this.client.debug.print(new Error(err));

		}

		return false;
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

}

module.exports = AccountAuth;