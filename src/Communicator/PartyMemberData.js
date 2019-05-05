const User = require('../User');
const EInputType = require('../../enums/InputType');

class PartyMemberData {

  constructor(communicator, data) {
    
    this.communicator = communicator;

    this.sender = new User(this.communicator.getClient(), data);

    this.partyId = data.partyId;

    this.payload = data.payload || this.makePayload();
    
    this.time = data.time;

    this.rev = 0;
    
  }

  send(to) {
    
    this.rev += 1;
    this.payload.Rev = this.rev;

    return this.communicator.sendRequest({

      to,

      body: JSON.stringify({

        type: 'com.epicgames.party.memberdata',

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

        type: 'com.epicgames.party.memberdata',

        payload: {
          partyId: this.partyId,
          payload: part,
        },

        timestamp: new Date(),

      }),

    });

  }
  
  setReady(isReady, jid) {

    this.payload.Attrs.GameReadiness_s = isReady ? 'Ready' : 'NotReady';
    
    const part = {
      
      Attrs: {
        GameReadiness_s: this.payload.Attrs.GameReadiness_s,
        ReadyInputType_s: this.payload.Attrs.ReadyInputType_s,
      },

    };

    if (!jid) return false;

    if (Array.isArray(jid)) {
      jid.forEach(j => this.sendPart(part, j));
    } else this.sendPart(part, jid);

    return true;
  }

  setEmote(emoteAsset, jid) {

    this.payload.Attrs.FrontendEmote_j = {
      FrontendEmote: {
        emoteItemDef: `AthenaDanceItemDefinition'${emoteAsset}'`,
        emoteItemDefEncryptionKey: '',
        emoteSection: -2,
      },
    };

    const part = {
      
      Attrs: {
        FrontendEmote_j: this.payload.Attrs.FrontendEmote_j,
      },

    };

    if (!jid) return false;

    if (Array.isArray(jid)) {
      jid.forEach(j => this.sendPart(part, j));
    } else this.sendPart(part, jid);

    return true;
  }

  clearEmote(jid) {

    this.payload.Attrs.FrontendEmote_j = {
      FrontendEmote: {
        emoteItemDef: 'None',
        emoteItemDefEncryptionKey: '',
        emoteSection: -1,
      },
    };
    
    const part = {
      
      Attrs: {
        FrontendEmote_j: this.payload.Attrs.FrontendEmote_j,
      },

    };

    if (!jid) return false;

    if (Array.isArray(jid)) {
      jid.forEach(j => this.sendPart(part, j));
    } else this.sendPart(part, jid);

    return true;
  }

  setBRCharacter(characterAsset, jid) {

    this.payload.Attrs.AthenaCosmeticLoadout_j.AthenaCosmeticLoadout.characterDefinition = `AthenaCharacterItemDefinition'${characterAsset}'`;
      
    const part = {
      
      Attrs: {
        CampaignHero_j: this.payload.Attrs.CampaignHero_j,
        AthenaCosmeticLoadout_j: this.payload.Attrs.AthenaCosmeticLoadout_j,
      },

    };

    if (!jid) return false;

    if (Array.isArray(jid)) {
      jid.forEach(j => this.sendPart(part, j));
    } else this.sendPart(part, jid);

    return true;
  }

  setBackpack(backpackAsset, jid) {

    this.payload.Attrs.AthenaCosmeticLoadout_j.AthenaCosmeticLoadout.backpackDefinition = `AthenaBackpackItemDefinition'${backpackAsset}'`;
      
    const part = {
      
      Attrs: {
        AthenaCosmeticLoadout_j: this.payload.Attrs.AthenaCosmeticLoadout_j,
      },

    };

    if (!jid) return false;

    if (Array.isArray(jid)) {
      jid.forEach(j => this.sendPart(part, j));
    } else this.sendPart(part, jid);

    return true;
  }

  /**
   * This method currently not working.
   */
  setBRBanner(id, color, seasonLevel, jid) {

    this.payload.Attrs.AthenaBannerInfo_j.AthenaBannerInfo = {
      bannerIconId: id,
      bannerColorId: color,
      seasonLevel,
    };

    this.payload.Attrs.HomeBaseVersion_U = parseInt(this.payload.Attrs.HomeBaseVersion_U, 10) + 1;
    this.payload.Attrs.HomeBaseVersion_U = this.payload.Attrs.HomeBaseVersion_U.toString();
    
    const part = {
      
      Attrs: {
        HomeBaseVersion_U: this.payload.Attrs.HomeBaseVersion_U,
        AthenaBannerInfo_j: this.payload.Attrs.AthenaBannerInfo_j,
      },

    };

    if (!jid) return false;

    if (Array.isArray(jid)) {
      jid.forEach(j => this.sendPart(part, j));
    } else this.sendPart(part, jid);

    return true;
  }
  
  setInputType(inputType, jid) {
    
    switch (inputType) {

      case EInputType.MouseAndKeyboard:
        this.payload.Attrs.CurrentInputType_s = 'MouseAndKeyboard';
        break;

      case EInputType.Controller:
        this.payload.Attrs.CurrentInputType_s = 'Pad';
        break;

      case EInputType.Touch:
        this.payload.Attrs.CurrentInputType_s = 'Touch';
        break;

      default:
        this.payload.Attrs.CurrentInputType_s = 'MouseAndKeyboard';

    }
    
    const part = {
      
      Attrs: {
        CurrentInputType_s: this.payload.Attrs.CurrentInputType_s,
      },

    };

    if (!jid) return false;

    if (Array.isArray(jid)) {
      jid.forEach(j => this.sendPart(part, j));
    } else this.sendPart(part, jid);

    return true;
  }
  
  setBattlePass(show, passLevel, selfBoostXp, friendBoostXp, jid) {

    this.payload.Attrs.BattlePassInfo_j = {
      BattlePassInfo: {
        bHasPurchasedPass: !!show,
        passLevel,
        selfBoostXp,
        friendBoostXp,
      },
    };
    
    const part = {
      
      Attrs: {
        BattlePassInfo_j: this.payload.Attrs.BattlePassInfo_j,
      },

    };

    if (!jid) return false;

    if (Array.isArray(jid)) {
      jid.forEach(j => this.sendPart(part, j));
    } else this.sendPart(part, jid);

    return true;
  }

  makePayload() {

    const defaultCharacters = [
      'CID_001_Athena_Commando_F_Default.CID_001_Athena_Commando_F_Default',
      'CID_002_Athena_Commando_F_Default.CID_002_Athena_Commando_F_Default',
      'CID_003_Athena_Commando_F_Default.CID_003_Athena_Commando_F_Default',
      'CID_004_Athena_Commando_F_Default.CID_004_Athena_Commando_F_Default',
      'CID_005_Athena_Commando_M_Default.CID_005_Athena_Commando_M_Default',
      'CID_006_Athena_Commando_M_Default.CID_006_Athena_Commando_M_Default',
      'CID_007_Athena_Commando_M_Default.CID_007_Athena_Commando_M_Default',
      'CID_008_Athena_Commando_M_Default.CID_008_Athena_Commando_M_Default',
    ];

    const character = defaultCharacters[Math.floor(Math.random() * defaultCharacters.length)];

    return {

      Rev: 0,

      Attrs: {
        
        Location_s: 'PreLobby',

        CampaignHero_j: { // PVE CHARACTER LOADOUT
          CampaignHero: {
            heroItemInstanceId: '',
            heroType: `AthenaCharacterItemDefinition'/Game/Athena/Items/Cosmetics/Characters/${character}'`,
          },
        },

        MatchmakingLevel_U: '0',
        ZoneInstanceId_s: '',
        HomeBaseVersion_U: '1',
        HasPreloadedAthena_b: false,

        FrontendEmote_j: {

          FrontendEmote: {

            emoteItemDef: 'None',
            emoteItemDefEncryptionKey: '',
            emoteSection: -1,

          },

        },

        NumAthenaPlayersLeft_U: '0',
        UtcTimeStartedMatchAthena_s: new Date('0001-01-01T00:00:00.000Z'),
        GameReadiness_s: 'NotReady',
        HiddenMatchmakingDelayMax_U: '0',
        ReadyInputType_s: 'Count',
        CurrentInputType_s: 'MouseAndKeyboard',

        AssistedChallengeInfo_j: {
          AssistedChallengeInfo: {
            questItemDef: 'None',
            objectivesCompleted: 0,
          },
        },

        MemberSquadAssignmentRequest_j: {
          MemberSquadAssignmentRequest: {
            MemberSquadAssignmentRequest: {
              startingAbsoluteIdx: -1,
              targetAbsoluteIdx: -1,
              swapTargetMemberId: 'INVALID',
              version: 0,
            },
          },
        },

        AthenaCosmeticLoadout_j: { // BR CHARACTER LOADOUT

          AthenaCosmeticLoadout: {

            characterDefinition: `AthenaCharacterItemDefinition'/Game/Athena/Items/Cosmetics/Characters/${character}'`,

            characterDefinitionEncryptionKey: '',
            backpackDefinition: 'None',

            backpackDefinitionEncryptionKey: '',

            pickaxeDefinition: 'AthenaPickaxeItemDefinition\'/Game/Athena/Items/Cosmetics/Pickaxes/DefaultPickaxe.DefaultPickaxe\'',
            pickaxeDefinitionEncryptionKey: '',

            cosmeticVariants: [],

          },

        },

        AthenaBannerInfo_j: {

          AthenaBannerInfo: {

            bannerIconId: 'standardbanner15',
            bannerColorId: 'defaultcolor15',
            seasonLevel: 1,

          },

        },

        BattlePassInfo_j: {

          BattlePassInfo: {
            
            bHasPurchasedPass: false,
            passLevel: 999999999,
            selfBoostXp: 99999,
            friendBoostXp: 99999,

          },
        },

        Platform_j: {
          Platform: {
            platformStr: 'WIN',
          },
        },

        PlatformUniqueId_s: 'INVALID',
        PlatformSessionId_s: '',
        CrossplayPreference_s: 'OptedIn',

      },

    };
  }

}

module.exports = PartyMemberData;
