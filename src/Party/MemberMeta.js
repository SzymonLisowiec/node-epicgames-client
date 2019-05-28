const Meta = require('./Meta');
const EInputType = require('../../enums/InputType');

class MemberMeta extends Meta {

  constructor(member, meta) {
    super();

    this.member = member;

    const defaultCharacters = [
      'CID_001_Athena_Commando_F_Default',
      'CID_002_Athena_Commando_F_Default',
      'CID_003_Athena_Commando_F_Default',
      'CID_004_Athena_Commando_F_Default',
      'CID_005_Athena_Commando_M_Default',
      'CID_006_Athena_Commando_M_Default',
      'CID_007_Athena_Commando_M_Default',
      'CID_008_Athena_Commando_M_Default',
    ];

    const character = defaultCharacters[Math.floor(Math.random() * defaultCharacters.length)];
    
    this.schema = {
      Location_s: 'PreLobby',
      CampaignHero_j: JSON.stringify({
        CampaignHero: {
          heroItemInstanceId: '',
          heroType: `FortHeroType'/Game/Athena/Heroes/${character}.${character}'`,
        },
      }),
      MatchmakingLevel_U: '0',
      ZoneInstanceId_s: '',
      HomeBaseVersion_U: '1',
      HasPreloadedAthena_b: false,
      FrontendEmote_j: JSON.stringify({
        FrontendEmote: {
          emoteItemDef: 'None',
          emoteItemDefEncryptionKey: '',
          emoteSection: -1,
        },
      }),
      NumAthenaPlayersLeft_U: '0',
      UtcTimeStartedMatchAthena_s: '0001-01-01T00:00:00.000Z',
      GameReadiness_s: 'NotReady',
      HiddenMatchmakingDelayMax_U: '0',
      ReadyInputType_s: 'Count',
      CurrentInputType_s: 'MouseAndKeyboard',
      AssistedChallengeInfo_j: JSON.stringify({
        AssistedChallengeInfo: {
          questItemDef: 'None',
          objectivesCompleted: 0,
        },
      }),
      MemberSquadAssignmentRequest_j: JSON.stringify({
        MemberSquadAssignmentRequest: {
          startingAbsoluteIdx: -1,
          targetAbsoluteIdx: -1,
          swapTargetMemberId: 'INVALID',
          version: 0,
        },
      }),
      AthenaCosmeticLoadout_j: JSON.stringify({
        AthenaCosmeticLoadout: {
          characterDefinition: `AthenaCharacterItemDefinition'/Game/Athena/Items/Cosmetics/Characters/${character}.${character}'`,
          characterDefinitionEncryptionKey: '',
          backpackDefinition: 'None',
          backpackDefinitionEncryptionKey: '',
          pickaxeDefinition: 'AthenaPickaxeItemDefinition\'/Game/Athena/Items/Cosmetics/Pickaxes/DefaultPickaxe.DefaultPickaxe\'',
          pickaxeDefinitionEncryptionKey: '',
          cosmeticVariants: [],
        },
      }),
      AthenaBannerInfo_j: JSON.stringify({
        AthenaBannerInfo: {
          bannerIconId: 'standardbanner15',
          bannerColorId: 'defaultcolor15',
          seasonLevel: 1,
        },
      }),
      BattlePassInfo_j: JSON.stringify({
        BattlePassInfo: {
          bHasPurchasedPass: false,
          passLevel: 1,
          selfBoostXp: 0,
          friendBoostXp: 0,
        },
      }),
      Platform_j: JSON.stringify({
        Platform: {
          platformStr: 'WIN',
        },
      }),
      PlatformUniqueId_s: 'INVALID',
      PlatformSessionId_s: '',
      CrossplayPreference_s: 'OptedIn',
    };

    if (meta) this.update(meta, true);

  }

  async setPlatform(platform) {
    let loadout = this.get('Platform_j');
    loadout = this.set('Platform_j', {
      ...loadout,
      Platform: {
        ...loadout.Platform,
        platformStr: platform,
      },
    });
    await this.member.patch({
      Platform_j: loadout,
    });
  }

  async setBanner(data) {
    let loadout = this.get('AthenaBannerInfo_j');
    loadout = this.set('AthenaBannerInfo_j', {
      ...loadout,
      AthenaBannerInfo: {
        ...loadout.AthenaBannerInfo,
        ...data,
      },
    });
    await this.member.patch({
      AthenaBannerInfo_j: loadout,
    });
  }

  async setBattlePass(data) {
    let loadout = this.get('BattlePassInfo_j');
    loadout = this.set('BattlePassInfo_j', {
      ...loadout,
      BattlePassInfo: {
        ...loadout.BattlePassInfo,
        ...data,
      },
    });
    await this.member.patch({
      BattlePassInfo_j: loadout,
    });
  }

  async setCosmeticLoadout(data) {
    let loadout = this.get('AthenaCosmeticLoadout_j');
    loadout = this.set('AthenaCosmeticLoadout_j', {
      ...loadout,
      AthenaCosmeticLoadout: {
        ...loadout.AthenaCosmeticLoadout,
        ...data,
      },
    });
    await this.member.patch({
      AthenaCosmeticLoadout_j: loadout,
    });
  }

  async setEmote(data) {
    let loadout = this.get('FrontendEmote_j');
    loadout = this.set('FrontendEmote_j', {
      ...loadout,
      FrontendEmote: {
        ...loadout.FrontendEmote,
        ...data,
      },
    });
    await this.member.patch({
      FrontendEmote_j: loadout,
    });
  }

  async setInputType(inputType) {
    await this.member.patch({
      CurrentInputType_s: this.set('CurrentInputType_s', Object.keys(EInputType)[inputType]),
    });
  }

  async setReady(ready) {
    await this.member.patch({
      GameReadiness_s: this.set('GameReadiness_s', ready === true ? 'Ready' : 'NotReady'),
      ReadyInputType_s: this.get('CurrentInputType_s'),
    });
  }

  async isReady() {
    return this.get('GameReadiness_s') === 'Ready';
  }

}

module.exports = MemberMeta;
