const User = require('../User');

class PartyData {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;

		// TODO: data.payload
		
		this.time = data.time;
		
	}

}

module.exports = PartyData;