const User = require('../User');

class PartyMemberData {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;

		// TODO: data.payload
		this.payload = data.payload;
		
		this.time = data.time;
		
	}

	send (to) {

		return this.communicator.sendRequest({

			to,

			body: JSON.stringify({

				type: 'com.epicgames.party.memberdata',

				payload: {
					partyId: this.party_id,
					payload: this.payload
				},

				timestamp: new Date()

			})

		});

	}

}

module.exports = PartyMemberData;