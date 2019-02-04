const User = require('../User');

class PartyJoinRequestApproved {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;
		this.party_type_id = data.party_type_id;
		this.access_key = data.access_key;

		this.presence_permissions = data.presence_permissions;
		this.invite_permissions = data.invite_permissions;
		this.party_flags = data.party_flags;
		this.not_accepting_member_reason = data.not_accepting_member_reason;
		this.max_members = data.max_members;
		this.password = data.password;

		this.members = data.members.map(member => {
			return new User(this.communicator.getClient(), {
				account_id: member.userId,
				display_name: member.displayName,
				jid: this.communicator.makeJID(member.userId + '@prod.ol.epicgames.com/' + member.xmppResource)
			});
		});
		
		this.time = data.time;
		
	}

}

module.exports = PartyJoinRequestApproved;