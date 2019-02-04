const User = require('../User');

class PartyJoinRequest {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;
		this.access_key = data.access_key;

		this.platform = data.platform || '';

		this.app_id = data.app_id;
		this.build_id = data.build_id;
		
		this.time = data.time;
		
	}

	send (to) {

		return this.communicator.sendRequest({

			to,

			body: JSON.stringify({

				type: 'com.epicgames.party.joinrequest',

				payload: {
					partyId: this.party_id,
					accessKey: this.access_key,
					displayName: this.sender.display_name,
					platform: this.platform,
					appid: this.app_id,
					buildid: this.build_id
				},

				timestamp: new Date()

			})

		});

	}

}

module.exports = PartyJoinRequest;