const User = require('../User');

class PartyMemberJoined {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;

		this.member = new User(this.communicator.getClient(), {
			account_id: data.member.userId,
			display_name: data.member.display_name,
			jid: this.communicator.makeJID(data.member.userId + '@prod.ol.epicgames.com/' + data.member.xmppResource)
		});
		
		this.time = data.time;
		
	}

}

module.exports = PartyMemberJoined;