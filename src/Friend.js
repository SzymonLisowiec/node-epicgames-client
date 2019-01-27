const User = require('./User');

class Friend extends User {

	constructor (client, data) {
		super(client, data);
		
		this.status = data.status || 'UNDEFINED'; // UNDEFINED, PENDING, ACCEPTED, BLOCKED, REMOVED

		this.last_action_at = data.time || this.last_action_at || null;
		this.time = this.last_action_at;  // backward compatibility

		this.favorite = data.favorite || undefined;

		/**
		 * backward compatibility for getFriends() method:
		 */
		this.direction = data.direction;
		this.created = data.created;
		
	}

	static async invite (client, account_id) {

		if(await client.inviteFriend(account_id)){

			return new this(client, {
				account_id: account_id,
				status: 'PENDING',
				last_action_at: new Date();
			});
			
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