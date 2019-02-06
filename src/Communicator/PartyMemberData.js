const User = require('../User');

class PartyMemberData {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.party_id = data.party_id;

		// TODO: data.payload
		this.payload = data.payload || this.makePayload();
		
		this.time = data.time;
		
	}

	send (to) {

		return this.communicator.sendRequest({

			to,

			body: JSON.stringify({

				type: 'com.epicgames.party.memberdata',

				payload: {
					partyId: this.party_id,
					payload: this.payload
				},

				timestamp: new Date()

			})

		});

	}

	sendPart (part, to) {

		return this.communicator.sendRequest({

			to,

			body: JSON.stringify({

				type: 'com.epicgames.party.memberdata',

				payload: {
					partyId: this.party_id,
					payload: part
				},

				timestamp: new Date()

			})

		});

	}
	
	setReady (is_ready, jid) {

		this.payload.Attrs.FrontendEmote_j.IsReadyAthena_b = is_ready;
		
		let part = {

			Rev: 1,
			
			Attrs: {
				IsReadyAthena_b: this.payload.Attrs.IsReadyAthena_b,
				ReadyInputType_s: this.payload.Attrs.ReadyInputType_s
			}

		};

		if(!jid)
			return false;

		if(Array.isArray(jid)){
			jid.forEach(j => this.sendPart(part, j));
		}else this.sendPart(part, jid);

	}

	setEmote (emote_asset, jid) { // emote_asset e.g. /Game/Athena/Items/Cosmetics/Dances/EID_KPopDance01.EID_KPopDance01

		this.payload.Attrs.FrontendEmote_j.FrontendEmote = {
			emoteItemDef: 'AthenaDanceItemDefinition\'' + emote_asset + '\'',
			emoteItemDefEncryptionKey: '',
			emoteSection: -2
		};

		let part = {

			Rev: 1,
			
			Attrs: {
				FrontendEmote_j: this.payload.Attrs.FrontendEmote_j,
			}

		};

		if(!jid)
			return false;

		if(Array.isArray(jid)){
			jid.forEach(j => this.sendPart(part, j));
		}else this.sendPart(part, jid);

	}

	clearEmote (jid) {

		this.payload.Attrs.FrontendEmote_j.FrontendEmote = {
			emoteItemDef: 'None',
			emoteItemDefEncryptionKey: '',
			emoteSection: -1
		};
		
		let part = {

			Rev: 2,
			
			Attrs: {
				FrontendEmote_j: this.payload.Attrs.FrontendEmote_j,
			}

		};

		if(!jid)
			return false;

		if(Array.isArray(jid)){
			jid.forEach(j => this.sendPart(part, j));
		}else this.sendPart(part, jid);

	}


	setBRCharacter (character_asset, jid) { // character_asset e.g. /Game/Athena/Items/Cosmetics/Characters/CID_342_Athena_Commando_M_StreetRacerMetallic.CID_342_Athena_Commando_M_StreetRacerMetallic

		this.payload.Attrs.AthenaCosmeticLoadout_j.AthenaCosmeticLoadout.characterDefinition = '\AthenaCharacterItemDefinition\'' + character_asset + '\'';
		
		let part = {

			Rev: 3,
			
			Attrs: {
				CampaignHero_j: this.payload.Attrs.CampaignHero_j,
				AthenaCosmeticLoadout_j: this.payload.Attrs.AthenaCosmeticLoadout_j
			}

		};

		if(!jid)
			return false;

		if(Array.isArray(jid)){
			jid.forEach(j => this.sendPart(part, j));
		}else this.sendPart(part, jid);

	}

	makePayload () {

		let default_characters = [
			'CID_001_Athena_Commando_F_Default.CID_001_Athena_Commando_F_Default',
			'CID_002_Athena_Commando_F_Default.CID_002_Athena_Commando_F_Default',
			'CID_003_Athena_Commando_F_Default.CID_003_Athena_Commando_F_Default',
			'CID_004_Athena_Commando_F_Default.CID_004_Athena_Commando_F_Default',
			'CID_005_Athena_Commando_M_Default.CID_005_Athena_Commando_M_Default',
			'CID_006_Athena_Commando_M_Default.CID_006_Athena_Commando_M_Default',
			'CID_007_Athena_Commando_M_Default.CID_007_Athena_Commando_M_Default',
			'CID_008_Athena_Commando_M_Default.CID_008_Athena_Commando_M_Default',
		];

		let character = default_characters[Math.floor(Math.random() * default_characters.length)];

		return {

			Rev: 4,

			Attrs: {
				
				Location_s: 'PreLobby',

				CampaignHero_j: { // PVE CHARACTER LOADOUT
					CampaignHero: {
						heroItemInstanceId: '',
						heroType: 'AthenaCharacterItemDefinition\'/Game/Athena/Items/Cosmetics/Characters/' + character + '\''
					}
				},

				MatchmakingLevel_U: '0',
				ZoneInstanceId_s: '',
				HomeBaseVersion_U: '1',
				HasPreloadedAthena_b: false,

				FrontendEmote_j: {

					FrontendEmote: {

						emoteItemDef: 'None',
						emoteItemDefEncryptionKey: '',
						emoteSection:-1

					}

				},

				NumAthenaPlayersLeft_U: '0',
				UtcTimeStartedMatchAthena_s: new Date('0001-01-01T00:00:00.000Z'),
				IsReadyAthena_b: false,
				HiddenMatchmakingDelayMax_U: '0',
				ReadyInputType_s: 'Count',
				CurrentInputType_s: 'MouseAndKeyboard',

				AthenaCosmeticLoadout_j: { // BR CHARACTER LOADOUT

					AthenaCosmeticLoadout: {

						characterDefinition: '\AthenaCharacterItemDefinition\'/Game/Athena/Items/Cosmetics/Characters/' + character + '\'',

						characterDefinitionEncryptionKey: '',
						backpackDefinition: 'None',

						backpackDefinitionEncryptionKey: '',

						pickaxeDefinition: 'AthenaPickaxeItemDefinition\'/Game/Athena/Items/Cosmetics/Pickaxes/DefaultPickaxe.DefaultPickaxe\'',
						pickaxeDefinitionEncryptionKey: '',

						cosmeticVariants: []

					}

				},

				AthenaBannerInfo_j: {

					AthenaBannerInfo: {

						bannerIconId: 'standardbanner15',
						bannerColorId: 'defaultcolor15',
						seasonLevel: 1

					}

				},

				BattlePassInfo_j: {

					BattlePassInfo: {
						
						bHasPurchasedPass: true,
						passLevel: 999999999,
						selfBoostXp: 99999,
						friendBoostXp: 99999

					}
				},

				Platform_j: {
					Platform: {
						platformStr: 'WIN'
					}
				},

				PlatformUniqueId_s: 'INVALID',
				PlatformSessionId_s: '',
				CrossplayPreference_s: 'OptedIn'

			}

		};
	}

}

module.exports = PartyMemberData;