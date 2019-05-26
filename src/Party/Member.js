const MemberConnection = require('./MemberConnection');
const MemberMeta = require('./MemberMeta');

class Member {

  constructor(party, data) {
    this.party = party;
    this.app = this.party.app;
    this.id = data.accountId || data.account_id;
    this.connections = [];
    if (Array.isArray(data.connections)) {
      data.connections.forEach(connection => new MemberConnection(this, connection));
    }
    this.joinedAt = new Date(data.joined_at);
    this.role = data.role || null;
    this.revision = 0;
    this.meta = new MemberMeta(this, data.meta);
  }

  update(data) {
    this.revision = data.revision;
    this.meta.update(data.member_state_updated, true);
  }

  async patch(updated) {
    await this.app.http.send(
      'PATCH',
      `https://party-service-prod.ol.epicgames.com/party/api/v1/${this.app.id}/parties/${this.party.id}/members/${this.id}/meta`,
      `${this.app.auth.tokenType} ${this.app.auth.accessToken}`,
      {
        delete: [],
        revision: this.revision,
        update: updated || this.meta.schema,
      },
    );
  }

  checkPermissions() {
    if (this.app.launcher.account.id !== this.id) {
      throw new Error('You can set only yourself meta.');
    }
  }
  
  isReady() {
    return this.meta.isReady();
  }

  // Not working
  // async setReady(...args) {
  //   this.checkPermissions();
  //   await this.meta.isReady(...args);
  // }

  async setInputType(...args) {
    this.checkPermissions();
    await this.meta.setInputType(...args);
  }

  async setPlatform(...args) {
    this.checkPermissions();
    await this.meta.setPlatform(...args);
  }

  async setEmote(asset) {
    this.checkPermissions();
    await this.meta.setEmote({
      emoteItemDef: asset,
    });
  }

  async setBanner(level, icon, color) {
    this.checkPermissions();
    const payload = {};
    if (typeof level === 'number') payload.seasonLevel = level;
    if (typeof icon === 'string' && icon !== '') payload.bannerIconId = icon;
    if (typeof color === 'string' && color !== '') payload.bannerColorId = color;
    await this.meta.setBanner(payload);
  }

  async setBattlePass(hasPuchased, level, selfBoostXp, friendBoostXp) {
    this.checkPermissions();
    const payload = {};
    if (typeof hasPuchased === 'boolean') payload.bHasPurchasedPass = hasPuchased;
    if (typeof level === 'number') payload.passLevel = level;
    if (typeof selfBoostXp === 'number') payload.selfBoostXp = selfBoostXp;
    if (typeof friendBoostXp === 'number') payload.friendBoostXp = friendBoostXp;
    await this.meta.setBattlePass(payload);
  }

  /**
   * TODO: Add support for variants
   * [
   *  {
   *     ownedVariantTags:{
   *       gameplayTags:[]
   *     },
   *     itemVariantIsUsedFor: 'AthenaCharacterItemDefinition\'/Game/Athena/Items/Cosmetics/Characters/CID_286_Athena_Commando_F_NeonCat.CID_286_Athena_Commando_F_NeonCat\'',
   *     variantChannelTag: {
   *       tagName:'Cosmetics.Variant.Channel.Parts'
   *    },
   *    activeVariantTag: {
   *      tagName: 'Cosmetics.Variant.Property.Stage4'
   *    }
   *  }
   * ]
   */

  async setOutfit(asset, key) {
    await this.meta.setCosmeticLoadout({
      characterDefinition: asset,
      characterDefinitionEncryptionKey: key || '',
    });
  }

  async setBackpack(asset, key) {
    await this.meta.setCosmeticLoadout({
      backpackDefinition: asset,
      backpackDefinitionEncryptionKey: key || '',
    });
  }

  async setPickaxe(asset, key) {
    await this.meta.setCosmeticLoadout({
      pickaxeDefinition: asset,
      pickaxeDefinitionEncryptionKey: key || '',
    });
  }

}

module.exports = Member;
