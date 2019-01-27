const User = require('./User');

class Friend extends User {

	constructor (client, data) {
		super(client, data);
		
		this.status = data.status || 'UNDEFINED'; // UNDEFINED, PENDING, ACCEPTED, BLOCKED, REMOVED

		this.last_action_at = data.time;
		this.time = this.last_action_at;  // backward compatibility
		
	}

	static async invite (client, account_id) {

		if(await client.inviteFriend(account_id)){
		
			this.status = 'PENDING';
	
			this.last_action_at = new Date();
			this.time = new Date();  // backward compatibility

			return true;
		}

		return false;
	}

	async remove () {
		
		if(await this.client.removeFriend(this.account_id)){

			this.status = 'REMOVED';

			this.last_action_at = new Date();
			this.time = new Date();  // backward compatibility

			return true;
		}

		return false;
	}

}

module.exports = Friend;