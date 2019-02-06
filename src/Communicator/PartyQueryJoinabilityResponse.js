const User = require('../User');

class PartyQueryJoinabilityResponse {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;
		this.is_joinable = data.is_joinable;

		this.rejection_type = data.rejection_type;
		this.result_param = data.result_param; // invite from host = empty; invite from non-host = host account_id
		
		this.time = data.time;
		
	}

	send (to) {

		return this.communicator.sendRequest({

			to,

			body: JSON.stringify({

				type: 'com.epicgames.party.queryjoinability.response',

				payload: {
					partyId: this.party_id,
					isJoinable: this.is_joinable,
					rejectionType: this.rejection_type,
					resultParam: this.result_param
				},

				timestamp: new Date()

			})

		});

	}

}

module.exports = PartyQueryJoinabilityResponse;