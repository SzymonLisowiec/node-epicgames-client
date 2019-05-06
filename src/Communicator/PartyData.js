const EPartyPrivacy = require('../../enums/PartyPrivacy');

const User = require('../User');

class PartyData {

  constructor(communicator, data) {
    
    this.communicator = communicator;

    this.sender = new User(this.communicator.getClient(), data);

    this.partyId = data.partyId;
    this.payload = data.payload || this.makePayload();
    
    this.time = data.time;

    this.rev = 0;
    
  }

  /**
   * Fortnite client needs it to render suitable background etc.
   */
  get partyState() {
    return this.payload.Attrs.PartyState_s || false;
  }

  get privacySettings() {

    const privacySettings = this.payload.Attrs.PrivacySettings_j.PrivacySettings;

    return privacySettings ? {
      type: privacySettings.partyType,
      inviteRestriction: privacySettings.partyInviteRestriction,
      onlyLeaderFriendsCanJoin: privacySettings.bOnlyLeaderFriendsCanJoin,
    } : false;
  }

  /**
   * e.g. creative mode allows join in progress
   */
  get allowJoinInProgress() {
    return this.payload.Attrs.AllowJoinInProgress_b || false;
  }

  get isSquadFill() {
    return this.payload.Attrs.AthenaSquadFill_b || false;
  }

  get partyIsJoinedInProgress() {
    return this.payload.Attrs.PartyIsJoinedInProgress_b || false;
  }

  /**
   * Game's session id while any lobby participant is in game
   */
  get gameSessionId() {
    return this.payload.Attrs.PrimaryGameSessionId_s || false;
  }

  /**
   * If game mode allows join while progress, we need this key to enter.
   */
  get gameSessionKey() {
    return this.payload.Attrs.GameSessionKey_s || false;
  }

  /**
   * Probably this is true while we started matchmaking
   */
  get connectionStarted() {
    return this.payload.Attrs.LobbyConnectionStarted_b || false;
  }

  get matchmakingResult() {
    return this.payload.Attrs.MatchmakingResult_s || false;
  }
  
  get matchmakingState() {
    return this.payload.Attrs.MatchmakingState_s || false;
  }
  
  /**
   * Selected game mode
   */
  get playlist() {

    const playlist = this.payload.Attrs.PlaylistData_j.PlaylistData;

    return {
      name: playlist.playlistName,
      tournamentId: playlist.tournamentId,
      eventWindowId: playlist.eventWindowId,
    };
  }

  send(to) {

    this.rev += 1;
    this.payload.Rev = this.rev;

    return this.communicator.sendRequest({

      to,

      body: JSON.stringify({

        type: 'com.epicgames.party.data',

        payload: {
          partyId: this.partyId,
          payload: this.payload,
        },

        timestamp: new Date(),

      }),

    });

  }

  sendPart(part, to) {

    this.rev += 1;
    part = {
      Rev: this.rev,
      ...part,
    };

    return this.communicator.sendRequest({

      to,

      body: JSON.stringify({

        type: 'com.epicgames.party.data',

        payload: {
          partyId: this.partyId,
          payload: part,
        },

        timestamp: new Date(),

      }),

    });

  }

  async setPrivacy(to, privacy, allowFriends) {

    switch (privacy) {

      case EPartyPrivacy.Public:
        this.payload.Attrs.PrivacySettings_j = {
          PrivacySettings: {
            partyType: 'Public',
            partyInviteRestriction: 'AnyMember',
            bOnlyLeaderFriendsCanJoin: false,
          },
        };
        break;

      case EPartyPrivacy.Friends:
        this.payload.Attrs.PrivacySettings_j = {
          PrivacySettings: {
            partyType: 'FriendsOnly',
            partyInviteRestriction: allowFriends ? 'AnyMember' : 'LeaderOnly',
            bOnlyLeaderFriendsCanJoin: !allowFriends,
          },
        };
        break;

      case EPartyPrivacy.Private:
        this.payload.Attrs.PrivacySettings_j = {
          PrivacySettings: {
            partyType: 'Private',
            partyInviteRestriction: allowFriends ? 'AnyMember' : 'LeaderOnly',
            bOnlyLeaderFriendsCanJoin: !allowFriends,
          },
        };
        break;

      default:
        throw new Error('Wrong `privacy` parameter.');

    }

    await this.sendPart({
      Attrs: {
        PrivacySettings_j: this.payload.Attrs.PrivacySettings_j,
      },
    }, to);

  }

  async setPlaylist(to, playlistName, tournamentId, eventWindowId) {

    this.payload.Attrs.PlaylistData_j.PlaylistData = {
      playlistName,
      tournamentId: tournamentId || '',
      eventWindowId: eventWindowId || '',
    };

    await this.sendPart({
      Attrs: {
        PlaylistData_j: this.payload.Attrs.PlaylistData_j,
      },
    }, to);

  }

  makePayload() {
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
          TileStates: [],
        },

        MatchmakingInfoString_s: '',
        CustomMatchKey_s: '',

        PlaylistData_j: {
          PlaylistData: {
            playlistName: 'Playlist_DefaultDuo',
            tournamentId: '',
            eventWindowId: '',
            regionId: 'EU',
          },
        },

        AllowJoinInProgress_b: false,
        LFGTime_s: new Date('0001-01-01T00:00:00.000Z'),
        AthenaSquadFill_b: false,
        PartyIsJoinedInProgress_b: false,
        GameSessionKey_s: '',
        // VoiceChannelGuid_s: '28BFC13749ECB3B0F2DBE8A8F62FDCD0',

        RawSquadAssignments_j: {
          RawSquadAssignments: [],
        },
        // RawSquadAssignments_j: {  
        //   RawSquadAssignments: [  
        //     {  
        //       memberId: '9a1d43b1d826420e9fa393a79b74b2ff',
        //       absoluteMemberIdx: 0,
        //     },
        //   ],
        // },
        // TODO: Add full support for RawSquadAssignments_j.RawSquadAssignments

        PrivacySettings_j: {
          PrivacySettings: {
            partyType: 'Public',
            partyInviteRestriction: 'AnyMember',
            bOnlyLeaderFriendsCanJoin: false,
          },
        },

        PlatformSessions_j: {
          PlatformSessions: [],
        },
      },

    };
  }

}

module.exports = PartyData;
