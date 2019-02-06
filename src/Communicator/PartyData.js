const User = require('../User');

class PartyData {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;
		this.payload = data.payload || this.makePayload();
		
		this.time = data.time;
		
	}

	/**
	 * Fortnite client needs it to render suitable background etc.
	 */
	get party_state () {
		return this.payload.Attrs.PartyState_s || false;
	}

	get privacy_settings () {

		let privacy_settings =  this.payload.Attrs.PrivacySettings_j.PrivacySettings;

		return privacy_settings ? {
			type: privacy_settings.partyType,
			invite_restriction: privacy_settings.partyInviteRestriction,
			only_leader_friends_can_join: privacy_settings.bOnlyLeaderFriendsCanJoin
		} : false;
	}

	/**
	 * e.g. creative mode allows join in progress
	 */
	get allow_join_in_progress () {
		return this.payload.Attrs.AllowJoinInProgress_b || false;
	}

	get is_squad_fill () {
		return this.payload.Attrs.AthenaSquadFill_b || false;
	}

	get party_is_joined_in_progress () {
		return this.payload.Attrs.PartyIsJoinedInProgress_b || false;
	}

	/**
	 * Game's session id while any lobby participant is in game
	 */
	get game_session_id () {
		return this.payload.Attrs.PrimaryGameSessionId_s || false;
	}

	/**
	 * If game mode allows join while progress, we need this key to enter.
	 */
	get game_session_key () {
		return this.payload.Attrs.GameSessionKey_s || false;
	}

	/**
	 * Probably this is true while we started matchmaking
	 */
	get connection_started () {
		return this.payload.Attrs.LobbyConnectionStarted_b || false;
	}

	get matchmaking_result () {
		return this.payload.Attrs.MatchmakingResult_s || false;
	}
	
	get matchmaking_state () {
		return this.payload.Attrs.MatchmakingState_s || false;
	}
	
	/**
	 * Selected game mode
	 */
	get playlist () {

		let playlist = this.payload.Attrs.PlaylistData;

		return {
			name: playlist.playlistName,
			tournament_id: playlist.tournamentId,
			event_window_id: playlist.eventWindowId
		};
	}

	send (to) {

		return this.communicator.sendRequest({

			to,

			body: JSON.stringify({

				type: 'com.epicgames.party.data',

				payload: {
					partyId: this.party_id,
					payload: this.payload
				},

				timestamp: new Date()

			})

		});

	}

	makePayload () {
		return {

			Rev: 1,

			Attrs: {
				PrimaryGameSessionId_s: '',
				PartyState_s: 'BattleRoyaleView',
				LobbyConnectionStarted_b: false,
				MatchmakingResult_s: 'NoResults',
				MatchmakingState_s: 'NotMatchmaking',
				SessionIsCriticalMission_b: false,
				ZoneTileIndex_U: -1,
				ZoneInstanceId_s: '',
				TheaterId_s: '',
				
				TileStates_j: {
					TileStates: []
				},

				MatchmakingInfoString_s: '',
				CustomMatchKey_s: '',

				PlaylistData_j: {
					PlaylistData: {
						playlistName: 'Playlist_DefaultDuo',
						tournamentId: '',
						eventWindowId: ''
					}
				},

				AllowJoinInProgress_b: false,
				LFGTime_s: new Date('0001-01-01T00:00:00.000Z'),
				AthenaSquadFill_b: false,
				PartyIsJoinedInProgress_b: false,
				GameSessionKey_s: '',

				PrivacySettings_j: {
					PrivacySettings: {
						partyType: 'Public',
						partyInviteRestriction: 'AnyMember',
						bOnlyLeaderFriendsCanJoin: false
					}
				},

				PlatformSessions_j: {
					PlatformSessions: []
				}
			}

		};
	}

}

module.exports = PartyData;