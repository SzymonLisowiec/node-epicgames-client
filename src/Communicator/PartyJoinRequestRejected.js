const User = require('../User');

class PartyJoinRequestRejected {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;
		this.access_key = data.access_key;

		this.platform = data.platform || '';

		this.app_id = data.app_id;
		this.build_id = data.build_id;

		this.join_data = data.join_data || null;
		
		this.time = data.time;
		
	}

	send (to) {

		let payload = {
			partyId: this.party_id,
			accessKey: this.access_key,
			displayName: this.sender.display_name,
			platform: this.platform,
			appid: this.app_id,
			buildid: this.build_id
		};

		if(this.join_data)
			payload.joinData = this.join_data;

		return this.communicator.sendRequest({

			to,

			body: JSON.stringify({

				type: 'com.epicgames.party.joinrequest',

				payload,

				timestamp: new Date()

			})

		});

	}

}

module.exports = PartyJoinRequestRejected;