const ENDPOINT = require('../../resources/ENDPOINT');

const Auth = require('./Auth');

class Account {

    constructor (client) {

        this.client = client;
        this.id = null;

        this.auth = null;

    }

    async fetch () {

        try {
            
			let { data } = await this.client.http.sendGet(
				ENDPOINT.ACCOUNT + '/' + this.id,
				this.auth.token_type + ' ' + this.auth.access_token
			);
            
            this.display_name = data.displayName;
            this.name = data.name;
            this.email = data.email;
            this.failed_login_attempts = data.failedLoginAttempts;
            this.last_login = new Date(data.lastLogin);
            this.numberOfDisplayNameChanges = data.numberOfDisplayNameChanges;
            this.ageGroup = data.ageGroup;
            this.headless = data.headless;
            this.country = data.country;
            this.last_name = data.lastName;
            this.preferred_language = data.preferredLanguage;

			return data;

		}catch(err){

			this.client.debug.print(new Error(err));

		}

        return false;
    }

    async authorize () {

        this.auth = new Auth(this.client);
        let auth = await this.auth.auth();

        if(auth){

            this.id = this.auth.account_id;
			await this.fetch();
            return true;
            
		}

        return false;
    }

}

module.exports = Account;