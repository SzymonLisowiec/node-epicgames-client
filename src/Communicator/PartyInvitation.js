const User = require('../User');

const PartyJoinRequest = require('./PartyJoinRequest');

class PartyInvitation {

	constructor (communicator, data) {
		
		this.communicator = communicator;
		
		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;
		this.party_type_id = data.party_type_id;
		this.access_key = data.access_key;

		this.app_id = data.app_id;
		this.build_id = data.build_id;
		
		this.time = data.time;
		
	}

}

module.exports = PartyInvitation;