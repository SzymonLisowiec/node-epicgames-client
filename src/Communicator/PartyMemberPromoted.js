const User = require('../User');

class PartyMemberPromoted {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;

		this.member = new User(this.communicator.getClient(), data.member);
		this.leader_leaving = data.leader_leaving;
		
		this.time = data.time;
		
	}

}

module.exports = PartyMemberPromoted;