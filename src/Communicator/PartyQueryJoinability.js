const User = require('../User');

class PartyQueryJoinability {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;
		this.access_key = data.access_key;

		this.app_id = data.app_id;
		this.build_id = data.build_id;

		this.join_data = data.join_data;
		
		this.time = data.time;
		
	}

	send (to) {

		return this.communicator.sendRequest({

			to,

			body: JSON.stringify({

				type: 'com.epicgames.party.queryjoinability',

				payload: {
					partyId: this.party_id,
					accessKey: this.access_key,
					appid: this.app_id,
					buildid: this.build_id,
					joinData: this.join_data
				},

				timestamp: new Date()

			})

		});

	}

}

module.exports = PartyQueryJoinability;