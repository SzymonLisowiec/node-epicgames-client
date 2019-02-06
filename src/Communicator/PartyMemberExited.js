const User = require('../User');

class PartyMemberExited {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;

		this.member = new User(this.communicator.getClient(), data.member_id);
		this.was_kicked = data.was_kicked;
		
		this.time = data.time;
		
	}

	send (to) {

		return this.communicator.sendRequest({

			to,

			body: JSON.stringify({

				type: 'com.epicgames.party.memberexited',

				payload: {
					partyId: this.party_id,
					memberId: this.member.id,
					wasKicked: this.was_kicked
				},

				timestamp: new Date()

			})

		});

	}

}

module.exports = PartyMemberExited;