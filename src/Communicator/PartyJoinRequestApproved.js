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

			let account_id = member.userId || member.id || member.account_id;

			return new User(this.communicator.getClient(), {
				account_id,
				display_name: member.displayName || member.display_name,
				jid: this.communicator.makeJID(account_id + '@prod.ol.epicgames.com/' + member.xmppResource)
			});
		});
		
		this.time = data.time;
		
	}

	send (to) {

		return this.communicator.sendRequest({

			to,

			body: JSON.stringify({

				type: 'com.epicgames.party.joinrequest.approved',

				payload: {
					partyId: this.party_id,
					partyTypeId: this.party_type_id,
					accessKey: this.access_key,
					presencePermissions: this.presence_permissions,
					invitePermissions: this.invite_permissions,
					partyFlags: this.party_flags,
					notAcceptingMembersReason: this.not_accepting_member_reason,
					maxMembers: this.max_members,
					password: this.password,
					members: this.members.map(member => {
						return {
							userId: member.id,
							displayName: member.display_name,
							xmppResource: member.jid.resource
						}
					})
				},

				timestamp: new Date()

			})

		});

	}

}

module.exports = PartyJoinRequestApproved;