const User = require('../User');

const PartyInvitationResponse = require('./PartyInvitationResponse');

class PartyInvitation {

	constructor (communicator, data) {
		
		this.communicator = communicator;
		this.client = this.communicator.getClient();
		
		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;
		this.party_type_id = data.party_type_id;
		this.access_key = data.access_key;

		this.app_id = data.app_id;
		this.build_id = data.build_id;
		
		this.time = data.time;

		this.party = data.party;
		
	}

	send (to) {

		return this.communicator.sendRequest({

			to,

			body: JSON.stringify({

				type: 'com.epicgames.party.invitation',

				payload: {
					partyId: this.party_id,
					partyTypeId: this.party_type_id,
					displayName: this.sender.display_name,
					accessKey: this.access_key,
					appId: this.app_id,
					buildId: this.build_id.toString()
				},

				timestamp: new Date()

			})

		});

	}

	async accept () {

		if(this.sender.id === this.client.account.id)
			return;

		return this.party.askToJoin(this.sender.jid);
	}

	async reject () {
		
		let response = new PartyInvitationResponse(this.communicator, {
			account_id: this.client.account.id,
			display_name: this.client.account.display_name,
			party_id: this.party_id,
			response: 2
		});

		return response.send(this.sender.jid);

	}

}

module.exports = PartyInvitation;