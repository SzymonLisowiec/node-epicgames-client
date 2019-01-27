const Friend = require('./Friend');

class FriendMessage {

	constructor (client, data) {

		this.client = client;
		this.friend = new Friend(this.client, data);

		this.account_id = this.friend.id; // backward compatibility
		this.message = data.message;
		this.time = data.time;
		
	}

	async reply (message) {
		
		this.client.communicator.sendMessage(this.friend.id, message);

	}

}

module.exports = FriendMessage;