const ENDPOINT = require('../../resources/ENDPOINT');

class AccountAuth {

	constructor (client) {
		
		this.client = client;
		
	}

	async auth () {
		
		try {
			
			let { data } = await this.client.http.sendPost(ENDPOINT.OAUTH_TOKEN, 'launcher', {
				grant_type: 'client_credentials',
				token_type: 'eg1'
			});
				
			if(data){

				this.access_token = data.access_token;
				this.expires_in = data.expires_in;
				this.expires_at = data.expires_at;
				this.token_type = data.token_type;
				this.client_id = data.client_id;
				this.internal_client = data.internal_client;
				this.client_service = data.client_service;

				return true;
		
			}

		}catch(err){
			
			this.client.debug.print(new Error(err));

		}
		
		return false;
	}

}

module.exports = AccountAuth;