const User = require('../User');

class PartyInvitationResponse {

	constructor (communicator, data) {
		
		this.communicator = communicator;
		
		this.sender = new User(this.communicator.getClient(), data);
		
		this.party_id = data.party_id;
		this.response = data.response;
		
		this.time = data.time;
		
	}

	send (to) {

		return this.communicator.sendRequest({

			to,

			body: JSON.stringify({

				type: 'com.epicgames.party.invitation.response',

				payload: {
					partyId: this.party_id,
					response: this.response
				},

				timestamp: new Date()

			})

		});

	}

}

module.exports = PartyInvitationResponse;