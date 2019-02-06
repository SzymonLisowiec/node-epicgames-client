const User = require('../User');

class PartyMemberJoined {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;

		let member_account_id = data.member.userId || data.member.account_id;
		this.member = new User(this.communicator.getClient(), {
			account_id: member_account_id,
			display_name: data.member.displayName || data.member.display_name,
			jid: this.communicator.makeJID(member_account_id + '@prod.ol.epicgames.com/' + data.member.xmppResource)
		});
		
		this.time = data.time;
		
	}

	send (to) {

		return this.communicator.sendRequest({

			to,

			body: JSON.stringify({

				type: 'com.epicgames.party.memberjoined',

				payload: {
					partyId: this.party_id,
					member: {
						userId: this.member.id,
						displayName: this.member.display_name,
						xmppResource: this.member.jid.resource
					}
				},

				timestamp: new Date()

			})

		});

	}

}

module.exports = PartyMemberJoined;