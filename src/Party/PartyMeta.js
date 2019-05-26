const Meta = require('./Meta');

class PartyMeta extends Meta {

  constructor(party, meta) {
    super();

    this.party = party;
    
    this.lastPushedSchema = {};

    this.schema = {
      PrimaryGameSessionId_s: '',
      PartyState_s: 'BattleRoyaleView',
      LobbyConnectionStarted_b: false,
      MatchmakingResult_s: 'NoResults',
      MatchmakingState_s: 'NotMatchmaking',
      SessionIsCriticalMission_b: false,
      ZoneTileIndex_U: -1,
      ZoneInstanceId_s: '',
      TheaterId_s: '',
      TileStates_j: JSON.stringify({
        TileStates: [],
      }),
      MatchmakingInfoString_s: '',
      CustomMatchKey_s: '',
      PlaylistData_j: JSON.stringify({
        PlaylistData: {
          playlistName: 'Playlist_DefaultDuo',
          tournamentId: '',
          eventWindowId: '',
          regionId: 'EU',
        },
      }),
      AthenaSquadFill_b: true,
      AllowJoinInProgress_b: false,
      LFGTime_s: '0001-01-01T00:00:00.000Z',
      PartyIsJoinedInProgress_b: false,
      GameSessionKey_s: '',
      RawSquadAssignments_j: '',
      PrivacySettings_j: JSON.stringify({
        PrivacySettings: {
          partyType: 'Public',
          partyInviteRestriction: 'LeaderOnly',
          bOnlyLeaderFriendsCanJoin: true,
        },
      }),
      PlatformSessions_j: JSON.stringify({
        PlatformSessions: [],
      }),
    };

    if (meta) this.update(meta, true);
    this.refreshSquadAssignments();

  }

  refreshSquadAssignments() {
    const assignments = [];
    let i = 0;
    this.party.members.forEach((member) => {
      if (member.role === 'CAPTAIN') {
        assignments.push({
          memberId: member.id,
          absoluteMemberIdx: 0,
        });
      } else {
        i += 1;
        assignments.push({
          memberId: member.id,
          absoluteMemberIdx: i,
        });
      }
    });
    this.set('RawSquadAssignments_j', {
      RawSquadAssignments: assignments,
    });
  }

}

module.exports = PartyMeta;
