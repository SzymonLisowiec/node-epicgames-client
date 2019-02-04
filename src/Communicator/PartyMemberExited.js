const User = require('../User');

class PartyMemberExited {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;

		this.member = new User(this.communicator.getClient(), data.member);
		this.was_kicked = data.was_kicked;
		
		this.time = data.time;
		
	}

}

module.exports = PartyMemberExited;