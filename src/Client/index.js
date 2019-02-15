const Events = require('events');
const ENDPOINT = require('../../resources/Endpoint');

const Http = require('../Http');
const WaitingRoom = require('../WaitingRoom');
const Account = require('../Account');
const Auth = require('./Auth');
const Debug = require('../Debug');
const Communicator = require('../Communicator');
const User = require('../User');
const Friend = require('../Friend');

class Client extends Events {

  constructor(config) {
    super(config);

    this.appName = 'Launcher';
    this.libraryName = process.env.KYSUNE_EPICGAMES_CLIENT || 'epicgames-client';

    this.config = {

      email: null,
      password: null,
      debug: null,
      useWaitingRoom: true,

      http: {},

      language: 'en-EN',

      ...config,

    };

    this.debug = new Debug({
      tool: this.config.debug,
    });

    this.os = 'Windows/10.0.17134.1.768.64bit';
    this.build = '9.6.1-4858958+++Portal+Release-Live'; // Build of Launcher
    this.UEBuild = '4.21.0-4858958+++Portal+Release-Live'; // Build of Unreal Engine

    this.http = new Http(this);
    this.http.setHeader('Accept-Language', this.config.language);

    // this.labelName = null;

    this.account = null;
    this.communicator = null;

    this.auth = null;
    this.entitlements = [];
    
  }

  /**
   * Sets client language
   */
  setLanguage(language) {
    this.http.setHeader('Accept-Language', language);
  }

  /**
   * Client initialize
   */
  async init() {
    
    try {

      let wait = false;
      if (this.config.useWaitingRoom) {
        const waitingRoom = new WaitingRoom(this, ENDPOINT.WAITING_ROOM);
        wait = await waitingRoom.needWait();
      }

      if (wait) {
        
        this.debug.print(`Problems with servers, need wait ${wait.expectedWait} seconds.`);
        const sto = setTimeout(() => {
          clearTimeout(sto);
          return this.init();
        }, wait.expectedWait * 1000);

      } else {
        
        this.auth = new Auth(this);
        const auth = await this.auth.auth();

        if (auth) {

          this.debug.print('Successfully the client authentication.');
          this.debug.print(`Client ID: ${this.auth.clientId}`);

          await this.getLauncherStatus(); // only for simulate official launcher

          /**
           * LAUNCHER INFO IS PROBABLY DEPRECATED
           */
          // let launcher_info = await this.getLauncherInfo();

          // if(launcher_info){

          //  this.build = launcher_info.buildVersion;
          //  this.app_name = launcher_info.appName;
          //  this.label_name = launcher_info.labelName;

          //  this.debug.print('Client build version: ' + this.build);
          //  this.debug.print('Client app name: ' + this.app_name);
          //  this.debug.print('Client label name: ' + this.label_name);

          //  this.debug.print('Client ready.');
          //  return true;

          // }

          this.debug.print('Client ready.');
          return true;

        }

      }

    } catch (err) {

      this.debug.print(new Error(err));

    }

    return false;
  }

  /**
   * Loging to an account.
   * @return {boolean} True if success.
   */
  async login() {

    this.account = new Account(this);
    const auth = await this.account.authorize();

    if (auth) {
      
      this.communicator = new Communicator(this);
      await this.communicator.connect();

      this.entitlements = await this.getEntitlements();

      this.debug.print('Account logged.');

      return true;
    }

    
    return false;
  }

  /**
   * Logouting
   * @return {boolean} True if success.
   */
  async logout() {

    await this.http.send(
      'DELETE',
      `${ENDPOINT.OAUTH_SESSIONS_KILL}/${this.account.auth.accessToken}`,
      `${this.account.auth.token_type} ${this.account.auth.accessToken}`,
    );
    
    return true;
  }

  /**
   * Checks if `value` is account's id.
   * @param {string} value
   * @return {boolean}
   */
  isID(value) {
    return value && typeof value === 'string' && value.length > 16;
  }

  /**
   * Checks if `value` is account's display name.
   * @param {string} value
   * @return {boolean}
   */
  isDisplayName(value) {
    return value && typeof value === 'string' && value.length >= 3 && value.length <= 16;
  }

  /**
   * Returns array of domains using by EpicGames.
   * @return {array}
   */
  async getEpicDomains() {

    try {
      
      const { data } = await this.http.sendGet(ENDPOINT.DOMAINS);

      return data;

    } catch (err) {

      this.debug.print(new Error(err));

    }

    return false;
  } 

  async lookup(displayName) {

    try {
      
      const { data } = await this.http.sendGet(
        `${ENDPOINT.ACCOUNT_BY_NAME}/${displayName}`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );
      
      return {
        id: data.id,
        accountName: data.displayName,
        externalAuths: data.externalAuths,
      };

    } catch (err) {

      if (err !== 'errors.com.epicgames.account.account_not_found') {
        this.debug.print(new Error(err));
      }

    }

    return false;
  }

  findActiveEntitlementByName(name) {
    return this.entitlements.find(entitlement => entitlement.entitlementName === name && entitlement.active === true);
  }

  async getEntitlements() {
    
    try {
      
      const { data } = await this.http.sendGet(
        `${ENDPOINT.ENTITLEMENTS.replace('{{account_id}}', this.account.id)}?start=0&count=5000`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );

      return data;

    } catch (err) {

      this.debug.print(new Error(err));

    }

    return false;
  }

  async getOffersForNamespace(namespace, count, start) {
    
    try {

      if (typeof count !== 'number') count = 10;

      if (typeof start !== 'number') start = 0;

      const { data } = await this.http.sendGet(
        `${ENDPOINT.CATALOG_OFFERS.replace('{{namespace}}', namespace)}?start=${start}&count=${count}`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );

      return data;

    } catch (err) {

      this.debug.print(new Error(err));

    }

    return false;
  }

  async quickPurchase(offer, quantity) {
    
    try {

      const lineOffers = [
        {
          offerId: offer.id,
          quantity: quantity || 1,
          namespace: offer.namespace,
        },
      ];

      const { data } = await this.http.send(
        'POST',
        ENDPOINT.ORDER_QUICKPURCHASE.replace('{{account_id}}', this.account.id),
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
        {
          salesChannel: 'Launcher-purchase-client',
          entitlementSource: 'Launcher-purchase-client',
          returnSplitPaymentItems: false,
          lineOffers,
        },
        true,
        null,
        true,
      );

      return data.quickPurchaseStatus && data.quickPurchaseStatus === 'SUCCESS';

    } catch (err) {

      this.debug.print(new Error(err));

    }

    return false;
  }

  /**
   * Get specyfic user profile
   * @param {string} id - account's id or display name
   * @return {boolean}
   */
  async getProfile(id) {

    const accounts = await this.getProfiles([id]);

    if (accounts.length === 1) return accounts[0];

    return false;
  }

  async getProfiles(ids) {

    let qs = ids.map(id => (this.isDisplayName(id) ? this.lookup(id) : id));
    qs = (await Promise.all(qs))
      .filter(id => id)
      .map(id => (typeof id === 'object' ? id.id : id))
      .map(id => `&accountId=${id}`)
      .join('')
      .substr(1);

    try {

      const { data } = await this.http.sendGet(
        `${ENDPOINT.ACCOUNT}?${qs}`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );

      return data.map(account => new User(this, {
        id: account.id,
        displayName: account.displayName,
        externalAuths: account.externalAuths,
      }));

    } catch (err) {

      this.debug.print(new Error(err));

    }

    return false;
  }

  async getFriends(includePending) {

    try {
      
      const { data } = await this.http.sendGet(
        `${ENDPOINT.FRIENDS}/${this.account.id}?includePending=${!!includePending}`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );
      
      return (Array.isArray(data) ? data : []).map(account => new Friend(this, {
        accountId: account.accountId,
        status: account.status,
        direction: account.direction,
        created: new Date(account.created),
        favorite: account.favorite,
      }));

    } catch (err) {
      
      this.debug.print('Cannot get friends list.');
      this.debug.print(new Error(err));

    }

    return [];
  }

  async getPendingFriends() {
    const friends = await this.getFriends(true);

    return friends ? friends.filter(friend => friend.status === 'PENDING') : [];
  }

  async hasFriend(id) {

    try {

      const user = await User.get(this, id);

      if (!user) { return false; }

      const friends = await this.getFriends();

      return friends.findIndex(friend => friend.id === user.id) > -1;

    } catch (err) {

      this.debug.print(new Error(err));

    }

    return false;
  }

  async getFriendsBlocklist() {

    try {

      const { data } = await this.http.sendGet(
        `${ENDPOINT.FRIENDS_BLOCKLIST}/${this.account.id}`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );

      return data === '' ? [] : data;

    } catch (err) {

      this.debug.print('Cannot get blocked friends.');
      this.debug.print(new Error(err));

    }

    return [];
  }

  /**
   * Block a friend.
   * @param {string} id - account's id or display name
   * @return {boolean}
   */
  async blockFriend(id) {

    try {
      
      const user = await User.get(this, id);

      if (!user) { return false; }

      await this.http.sendPost(
        `${ENDPOINT.FRIENDS_BLOCKLIST}/${this.account.id}/${user.id}`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );

      return new Friend(this, {
        id: user.id,
        displayName: user.displayName,
        status: 'BLOCKED',
        time: new Date(),
      });

    } catch (err) {

      this.debug.print(new Error(err));

    }

    return false;
  }

  /**
   * Remove a friend.
   * @param {string} id - account's id or display name
   * @return {boolean}
   */
  async removeFriend(id) {

    try {
      
      const user = await User.get(this, id);

      if (!user) { return false; }
      
      await this.http.send(
        'DELETE',
        `${ENDPOINT.FRIENDS}/${this.account.id}/${user.id}`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );

      return new Friend(this, {
        id: user.id,
        displayName: user.displayName,
        status: 'REMOVED',
        time: new Date(),
      });

    } catch (err) {

      this.debug.print(new Error(err));

    }

    return false;
  }

  /**
   * Invite a new friend.
   * @param {string} id - account's id or display name
   * @return {boolean}
   */
  async inviteFriend(id) {
    
    try {

      const user = await User.get(this, id);

      if (!user) { return false; }
        
      await this.http.sendPost(
        `${ENDPOINT.FRIENDS}/${this.account.id}/${user.id}`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );

      return new Friend(this, {
        id: user.id,
        displayName: user.displayName,
        status: 'PENDING',
        time: new Date(),
      });

    } catch (err) {

      this.debug.print(new Error(err));

    }

    return false;
  }

  /**
   * Accepting friend's invitation. Alias for method inviteFriend
   * @param {string} id - account's id or display name
   * @return {boolean}
   */
  async acceptFriendRequest(id) {
    return this.inviteFriend(id);
  }

  /**
   * Declining friend's invitation. Alias for method removeFriend
   * @param {string} id - account's id or display name
   * @return {boolean}
   */
  async declineFriendRequest(id) {
    return this.removeFriend(id);
  }

  async getLauncherStatus() {
    
    try {

      const { data } = await this.http.sendGet(
        `${ENDPOINT.LAUNCHER_STATUS}/${this.build}`,
        `${this.auth.tokenType} ${this.auth.accessToken}`,
      );

      return data.status;

    } catch (err) {

      this.debug.print('Cannot get launcher status.');
      this.debug.print(new Error(err));

    }

    return false;
  }

  async getLauncherInfo() { // PROBABLY DEPRECATED

    try {

      const { data } = await this.http.sendGet(
        `${ENDPOINT.LAUNCHER_INFO}?label=Live&subLabel=Belica`,
        `${this.auth.tokenType} ${this.auth.accessToken}`,
      );

      return data;

    } catch (err) {

      this.debug.print('Cannot get launcher info.');
      this.debug.print(new Error(err));

    }

    return false;
  }

  async checkEULA(namespace) {

    try {

      const { data } = await this.http.sendGet(
        `${ENDPOINT.EULA_TRACKING.replace('{{namespace}}', namespace)}/account/${this.account.id}?locale=${this.http.getHeader('Accept-Language')}`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );

      return !data ? true : data;

    } catch (err) {

      this.debug.print(`Cannot get EULA for namespace ${namespace}`);
      this.debug.print(new Error(err));

    }

    return false;
  }

  async acceptEULA(eula) {
    
    try {

      const { response } = await this.http.sendPost(
        `${ENDPOINT.EULA_TRACKING.replace('{{namespace}}', eula.key)}/version/${eula.version}/account/${this.account.id}/accept?locale=${eula.locale}`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );

      return response.statusCode === 204;

    } catch (err) {

      this.debug.print(`Cannot accept EULA v${eula.version} for namespace ${eula.key}`);
      this.debug.print(new Error(err));

    }

    return false;
  }

  async runGame(game, options) {
    
    try {

      this.debug.print(`Running game ${game.Namespace}`);

      let eula = await this.checkEULA(game.Namespace);

      if (eula !== true) {

        if (eula === false) {

          throw new Error(`Cannot get informations about EULA for game ${game.Namespace}!`);

        } else {

          await this.acceptEULA(eula);
          eula = await this.checkEULA(game.Namespace);

        }

      }

      if (eula !== true) { throw new Error(`Cannot accept EULA for game ${game.Namespace}!`); }

      if (!this.findActiveEntitlementByName('Fortnite_Free')) {

        if (typeof game.StoreOfferId === 'undefined') { throw new Error(`Account don't have game "${game.Name}".`); }
        
        const purchase = await this.quickPurchase({
          id: game.StoreOfferId,
          namespace: game.Namespace,
        });

        if (!purchase) { throw new Error(`Buy game "${game.Name}" has failed.`); }

        this.entitlements = await this.getEntitlements();

        this.debug.print(`Game "${game.Name}" has been bought!`);

      }

      const gameClient = new game.Client(this, options);

      if (!await gameClient.init()) { throw new Error(`Cannot initialize game ${game.Namespace}!`); }

      return gameClient;

    } catch (err) {

      this.debug.print('Cannot run game.');
      this.debug.print(new Error(err));

    }

    return false;
  }

}

module.exports = Client;
