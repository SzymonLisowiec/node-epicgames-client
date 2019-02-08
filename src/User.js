class User {

	constructor (client, data) {

		this.client = client;
		
		if(typeof data != 'object'){
			
			if(data === 'me'){

				data = {
					account_id: this.client.account.id,
					display_name: this.client.account.display_name
				}

			}else{

				data = {
					account_id: data
				};

			}

		}
		
		this.id = data.account_id || data.id;
		this.account_id = this.id; // backward compatibility

		if(!this.id){
			console.dir(data);
			throw new Error('Trying of initialize User without account id. Provided data above.');
		}

		this.jid = data.jid || null;

		if(!this.jid && this.client.communicator)
			this.jid = this.id + '@' + this.client.communicator.host;

		this.display_name = data.account_name || data.display_name || null;
		this.account_name = this.display_name; // backward compatibility

		this.external_auths = this.external_auths || [];

	}

	static async get (client, user) {
		
		if(typeof user == 'string' && client.isDisplayName(user)){

			let account = await client.lookup(user);
			if(account)
				return new this(client, account);
			else return false;

		}else return new this(client, user);

	}

}

module.exports = User;