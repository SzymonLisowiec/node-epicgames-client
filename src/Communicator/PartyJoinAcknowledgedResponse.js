const User = require('../User');

class PartyJoinAcknowledgedResponse {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;
		
		this.time = data.time;
		
	}

}

module.exports = PartyJoinAcknowledgedResponse;