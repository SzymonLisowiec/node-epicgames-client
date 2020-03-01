const Events = require('events');
const Cheerio = require('cheerio');
const exitHook = require('exit-hook');

const ENDPOINT = require('../../resources/Endpoint');

const EPlatform = require('../../enums/Platform');
const EPartyPrivacy = require('../../enums/PartyPrivacy');
const Http = require('../Http');
const WaitingRoom = require('../WaitingRoom');
const Account = require('../Account');
const Auth = require('./Auth');
const Debug = require('../Debug');
const Communicator = require('../Communicator');
const User = require('../User');
const Friend = require('../Friend');
const FriendRequest = require('../FriendRequest');

const Party = require('../Party');
const PartyInvitation = require('../Party/PartyInvitation');
const PartyJoinRequest = require('../Party/PartyJoinRequest');
const PartyMeta = require('../Party/PartyMeta');
const PartyMember = require('../Party/Member');
const PartyMemberConfirmation = require('../Party/MemberConfimation');
const PartyMemberConnection = require('../Party/MemberConnection');
const PartyMemberMeta = require('../Party/MemberMeta');

class Launcher extends Events {

  static get Communicator() { return Communicator; }

  static get Party() { return Party; }

  static get PartyInvitation() { return PartyInvitation; }
  
  static get PartyJoinRequest() { return PartyJoinRequest; }

  static get PartyMeta() { return PartyMeta; }

  static get PartyMember() { return PartyMember; }

  static get PartyMemberConfirmation() { return PartyMemberConfirmation; }

  static get PartyMemberConnection() { return PartyMemberConnection; }

  static get PartyMemberMeta() { return PartyMemberMeta; }

  /**
   * @param {Object} config 
   * @param {Object} config.email
   * @param {Object} config.password
   * @param {Object=} config.debug if you need console/file output with logs. Simple you can use `console.log`
   * @param {Object=} config.useWaitingRoom false to ignore waiting room (epicgames load balancer)
   * @param {Object=} config.language eg. `US`, `PL`
   * @param {Object=} config.http settings for lib https://github.com/request/request
   */
  constructor(config) {
    super(config);

    this.id = 'Launcher';

    this.config = {

      email: null,
      password: null,
      debug: null,
      useWaitingRoom: true,
      useCommunicator: true,
      partyMemberConfirmation: true,
      platform: {
        full: 'Windows',
        short: EPlatform.WIN,
        os: 'Windows/10.0.17134.1.768.64bit',
      },
      build: '10.2.3-7092195+++Portal+Release-Live', // named "Build" in official launcher logs
      engineBuild: '4.21.0-7092195+++Portal+Release-Live', // named "Engine Version" in official launcher logs
      netCL: 7092195, // named "Net CL" in official launcher logs

      http: {},

      language: 'en-EN',

      createPartyOnStart: true,
      defaultPartyConfig: {
        privacy: EPartyPrivacy.PUBLIC,
        joinConfirmation: false,
        joinability: 'OPEN',
        maxSize: 16,
        subType: 'default',
        type: 'default',
        inviteTTL: 14400,
        chatEnabled: true,
      },

      autoPresenceUpdating: true,

      ...config,

    };

    this.debug = new Debug({
      tool: this.config.debug,
    });

    this.http = new Http(this);
    this.http.setHeader('Accept-Language', this.config.language);

    this.account = null;
    this.communicator = null;
    // this.communicatorFriends = [];

    this.auth = null;
    this.entitlements = [];

    this.Communicator = Launcher.Communicator;
    this.Party = Launcher.Party;
    this.PartyInvitation = Launcher.PartyInvitation;
    this.PartyJoinRequest = Launcher.PartyJoinRequest;
    this.PartyMeta = Launcher.PartyMeta;
    this.PartyMember = Launcher.PartyMember;
    this.PartyMemberConfirmation = Launcher.PartyMemberConfirmation;
    this.PartyMemberConnection = Launcher.PartyMemberConnection;
    this.PartyMemberMeta = Launcher.PartyMemberMeta;

    exitHook(() => {
      this.emit('exit');
    });
    
  }

  /**
   * Sets client language
   * @param {string} language 
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
        try {
          const waitingRoom = new WaitingRoom(this, ENDPOINT.WAITING_ROOM);
          wait = await waitingRoom.needWait();
        } catch (error) {
          this.debug.print(new Error(`WaitingRoom error: ${error}`));
          return false;
        }
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
   * @param {(object|string|number|function|)=} options credentials or twoFactorCode, check wiki.
   */
  async login(options) {

    let credentials = {
      email: this.config.email || '',
      password: this.config.password || '',
      twoFactorCode: false,
    };
    
    switch (typeof options) { // backward compatibility

      case 'object':
        credentials = options;
        break;

      case 'string':
        credentials.twoFactorCode = options;
        break;

      case 'number':
        credentials.twoFactorCode = options;
        break;

      case 'function':
        credentials.twoFactorCode = options;
        break;

      default:
        if (typeof options !== 'undefined') {
          throw new Error('login() `options` must be object');
        }
        
    } 

    this.account = new Account(this);
    const auth = await this.account.authorize(credentials);

    if (auth) {

      if (this.config.useCommunicator) {
        this.communicator = new this.Communicator(this);

        // this.communicator.on('friends', (friends) => {
        //   friends = friends.map(friend => new Friend(this, { 
        //     ...friend,
        //     status: 'ACCEPTED',
        //   }));
        //   this.communicatorFriends = friends;
        // });

        // this.communicator.on('friend:added', (friend) => {
        //   this.communicatorFriends.push(friend);
        // });

        // this.communicator.on('friend:removed', (removedFriend) => {
        //   const friend = this.communicatorFriends.find(f => f.id === removedFriend.id);
        //   if (friend) this.communicatorFriends.splice(this.communicatorFriends.indexOf(friend), 1);
        // });

        // this.communicator.on('friend:status', (status) => {
        //   const friend = this.communicatorFriends.find(f => f.id === status.sender.id);
        //   if (friend) friend.status = status;
        // });

        await this.communicator.connect();
      }

      this.entitlements = await this.getEntitlements();

      this.debug.print('Account logged.');

      return true;
    }

    
    return false;
  }

  /**
   * @param {Object} options 
   * @param {string} options.country e.g. `US`, `PL`
   * @param {string} options.firstName
   * @param {string} options.lastName
   * @param {string} options.displayName
   * @param {string} options.email
   * @param {string} options.password
   */
  async register(options) {
    this.account = new Account(this);
    return this.account.register(options);
  }

  /**
   * @return {boolean} True if success.
   */
  async logout() {

    if (!this.account) return false;

    if (this.account.auth.tokenTimeout) clearTimeout(this.account.auth.tokenTimeout);
    if (this.communicator) await this.communicator.disconnect(false, true);

    await this.http.send(
      'DELETE',
      `${ENDPOINT.OAUTH_SESSIONS_KILL}/${this.account.auth.accessToken}`,
      `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
    );

    this.emit('logouted');

    this.removeAllListeners();
    
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

  /**
   * Returns account's id.
   * @param {string} displayName
   */
  async lookup(displayName) {

    try {
      
      const { data } = await this.http.sendGet(
        `${ENDPOINT.ACCOUNT_BY_NAME}/${encodeURI(displayName)}`,
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

  /**
   * @param {string} name 
   */
  findActiveEntitlementByName(name) {
    return this.entitlements.find(entitlement => entitlement.entitlementName === name && entitlement.active === true);
  }

  /**
   * Returns account's entitlements.
   */
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
  
  /**
   * Returns offers for game.
   * @param {*} namespace epicgame's namespace
   * @param {*} count 
   * @param {*} start 
   */
  async getOffersForNamespace(namespace, count, start, status) {
    
    try {

      if (typeof count !== 'number') count = 10;

      if (typeof start !== 'number') start = 0;

      const { data } = await this.http.sendGet(
        `${ENDPOINT.CATALOG_OFFERS.replace('{{namespace}}', namespace)}?start=${start}&count=${count}&status=${status}`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );

      return data;

    } catch (err) {

      this.debug.print(new Error(err));

    }

    return false;
  }

  /**
   * Buy offer.
   * @param {Object} offer object with `offerId` and `namespace`
   * @param {number} quantity 
   */
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

      return data.quickPurchaseStatus ? data.quickPurchaseStatus : false;

    } catch (err) {

      this.debug.print(new Error(err));

    }

    return false;
  }
  
  async newPurchase(offer) {
    let { data: purchase } = await this.http.sendGet(`https://launcher-website-prod07.ol.epicgames.com/purchase?showNavigation=true&namespace=${offer.namespace}&offers=${offer.id}`);
    purchase = Cheerio.load(purchase);
    const token = purchase('#purchaseToken').val();
    return {
      token,
    };
  }

  async purchaseOrderPreview(purchase, offer) {
    
    const { data } = await this.http.sendPost(
      `${ENDPOINT.PURCHASE}/order-preview`,
      `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      {
        useDefault: true,
        setDefault: false,
        namespace: offer.namespace,
        country: null,
        countryName: null,
        orderId: null,
        orderComplete: null,
        orderError: null,
        orderPending: null,
        offers: [
          offer.id,
        ],
        offerPrice: '',
      },
      true,
      {
        'x-requested-with': purchase.token,
      },
    );

    return data.syncToken ? data : false;
  }

  async purchaseOrderConfirm(purchase, order) {

    const { data } = await this.http.sendPost(
      `${ENDPOINT.PURCHASE}/confirm-order`,
      `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      {
        useDefault: true,
        setDefault: false,
        namespace: order.namespace,
        country: order.country,
        countryName: order.countryName,
        orderId: null,
        orderComplete: null,
        orderError: null,
        orderPending: null,
        offers: order.offers,
        includeAccountBalance: false,
        totalAmount: order.orderResponse.totalPrice,
        affiliateId: '',
        creatorSource: '',
        syncToken: order.syncToken,
      },
      true,
      {
        'x-requested-with': purchase.token,
      },
    );
    
    return data && data.confirmation;
  }

  async purchase(offer, quantity) {

    const quickPurchaseStatus = await this.quickPurchase(offer, quantity);

    switch (quickPurchaseStatus) {

      case 'SUCCESS':
        return true;

      case 'CHECKOUT': {
        const purchase = await this.newPurchase(offer);
        const order = await this.purchaseOrderPreview(purchase, offer);
        if (!order) return false;
        return this.purchaseOrderConfirm(purchase, order);
      }

      default:
        throw new Error(`Unknown quick purchase status: ${quickPurchaseStatus}`);

    }

  }

  /**
   * Returns specyfic user profile.
   * @param {string} id - account's id or display name
   */
  async getProfile(id) {

    const accounts = await this.getProfiles([id]);

    if (accounts.length === 1) return accounts[0];

    return false;
  }

  /**
   * Returns profiles of selected users.
   * @param {string[]} ids - array of accounts id or display name
   */
  async getProfiles(ids) {
    const limit = 100;

    let qs = ids.map(id => (this.isDisplayName(id) ? this.lookup(id) : id));
    qs = (await Promise.all(qs)).filter(id => id);

    if (!qs.length) return false;

    try {

      const promises = [];

      for (let i = 0; i <= Math.floor(qs.length / limit); i += 1) {
        const accounts = qs.slice(i * limit, limit + (limit * i))
          .map(id => (typeof id === 'object' ? id.id : id))
          .map(id => `&accountId=${id}`)
          .join('')
          .substr(1);
        promises.push(this.http.sendGet(
          `${ENDPOINT.ACCOUNT}?${accounts}`,
          `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
        ));
      }

      const result = await Promise.all(promises);
      let data = [];

      for (let i = 0; i < result.length; i += 1) {
        data = data.concat([...result[i].data.map(account => new User(this, {
          id: account.id,
          displayName: account.displayName,
          externalAuths: account.externalAuths,
        }))]);
      }

      return data;

    } catch (err) {

      this.debug.print(new Error(err));

    }

    return false;
  }

  /**
   * Returns raw data list of friends
   * @param {boolean} includePending true if you want get pending friends.
   */
  async getRawFriends(includePending) {

    try {

      const { data } = await this.http.sendGet(
        `${ENDPOINT.FRIENDS}/${this.account.id}?includePending=${!!includePending}`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );
      
      let friends = (Array.isArray(data) ? data : []).map(account => ({
        accountId: account.accountId,
        status: account.status,
        direction: account.direction,
        created: new Date(account.created),
        favorite: account.favorite,
      }));
      const ids = friends.map(friend => friend.accountId);
      const profiles = {};
      (await this.getProfiles(ids)).forEach((profile) => {
        profiles[profile.id] = {
          displayName: profile.displayName,
          externalAuths: profile.externalAuths,
        };
      });

      friends = friends.map((friend) => {
        if (profiles[friend.accountId]) return Object.assign(friend, profiles[friend.accountId]);
        return null;
      }).filter(friend => friend); // filter removes null values from array of friends.

      return friends;

    } catch (err) {

      this.debug.print('Cannot get friends data.');
      this.debug.print(new Error(err));

    }

    return [];
  }

  /**
   * Returns list of friends.
   */
  async getFriends() {

    let friends = await this.getRawFriends(false);

    friends = friends.map(friend => new Friend(this, friend)).filter(friend => friend); // filter removes null values from array of friends.

    return friends;
  }

  /**
   * Returns all received invites to friends.
   */
  async getFriendRequests() {

    let friends = await this.getRawFriends(true);
    
    friends = friends.map(friend => new FriendRequest(this, friend)).filter(friend => friend); // filter removes null values from array of friends.

    return friends ? friends.filter(friend => friend.status === 'PENDING') : [];
  }

  /**
   * Returns `true` if selected user is your friend.
   * @param {string} id account's id or display name
   */
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

  /**
   * Returns blocked friends.
   */
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
   * @param {string} id account's id or display name
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
   * @param {string} id account's id or display name
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
   * @param {string} id account's id or display name
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
   * Accept friend's invitation. Alias for method inviteFriend
   * @param {string} id account's id or display name
   * @return {boolean}
   */
  async acceptFriendRequest(id) {
    return this.inviteFriend(id);
  }

  /**
   * Decline friend's invitation. Alias for method removeFriend
   * @param {string} id - account's id or display name
   * @return {boolean}
   */
  async declineFriendRequest(id) {
    return this.removeFriend(id);
  }

  async getFriendStatus(id) {
    if (!this.communicator) throw new Error('Communicator support isn\'t enabled. To use this method, set `useCommunicator` on `true`.');
    const user = await User.get(this, id);
    await this.communicator.sendProbe(`${user.id}@${this.communicator.host}`);
    try {
      return await this.communicator.waitForEvent(`friend#${user.id}:status`, 5000, s => s.status);
    } catch (err) {
      throw new Error(`Could not retrieve status, error: ${err}`);
    }
  }

  /**
   * Returns launcher's status e.g. `DEPRECATED`.
   */
  async getLauncherStatus() {
    
    try {

      const { data } = await this.http.sendGet(
        `${ENDPOINT.LAUNCHER_STATUS}/${this.config.build}`,
        `${this.auth.tokenType} ${this.auth.accessToken}`,
      );

      return data.status;

    } catch (err) {

      this.debug.print('Cannot get launcher status.');
      this.debug.print(new Error(err));

    }

    return false;
  }

  /**
   * Returns informations about launcher.
   */
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

  /**
   * Returns EULA for selected game.
   * @param {string} namespace epicgames's namespace for game, e.g. `fn` for Fortnite.
   */
  async checkEULA(namespace) {

    try {

      const { data } = await this.http.sendGet(
        `${ENDPOINT.EULA_TRACKING.replace('{{namespace}}', namespace)}/account/${this.account.id}?locale=${this.http.getHeader('Accept-Language')}`,
        `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
      );

      return !data ? true : data;

    } catch (err) {

      if (err.message === 'errors.com.epicgames.eulatracking.agreement_not_found') {
        return true;
      }
      
      this.debug.print(`Cannot get EULA for namespace ${namespace}`);
      this.debug.print(new Error(err));

    }

    return false;
  }

  /**
   * Accepting eula received in `checkEULA()` method.
   * @param {Object} eula 
   */
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

  /**
   * Run a game.
   * @param {Object} game e.g. `require('epicgames-fortnite-client')` 
   * @param {*} options options for game client
   */
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

      const entitlement = this.entitlements.find(e => e.entitlementName === game.EntitlementName && e.namespace === game.Namespace && e.active === true);

      if (!entitlement) {

        if (typeof game.StoreOfferId === 'undefined') { throw new Error(`Account don't have game "${game.Name}" and cannot buy (no StoreOfferId).`); }
        
        const purchase = await this.purchase({
          id: game.StoreOfferId,
          namespace: game.Namespace,
        });

        if (!purchase) { throw new Error(`Buy game "${game.Name}" has failed.`); }

        this.entitlements = await this.getEntitlements();

        this.debug.print(`Game "${game.Name}" has been bought!`);

      }
      
      // const a = await this.checkVersionByAppName(game.Namespace, game.Name);
      // console.dir(a);
      
      // options = {

      //   ...options,
      // };
      
      const gameClient = new game.Client(this, options);

      if (!await gameClient.init()) { throw new Error(`Cannot initialize game ${game.Namespace}!`); }

      return gameClient;

    } catch (err) {

      this.debug.print('Cannot run game.');
      this.debug.print(new Error(err));

    }

    return false;
  }

  async checkAssetsVersions() {
    const { data } = await this.http.sendGet(`${ENDPOINT.ASSETS_VERSIONS.replace('{{platform}}', 'Windows')}?label=Live`);
    return data;
  }

  async checkVersionByAppName(namespace, appName) {
    const assets = await this.checkAssetsVersions();
    return assets.find(asset => asset.namespace === namespace && asset.appName === appName);
  }

  /**
   * Resend email verification.
   */
  async resendEmailVerification() {

    const exchange = await this.account.auth.exchange();

    await this.http.sendGet(`https://accounts.epicgames.com/exchange?exchangeCode=${exchange.code}&redirectUrl=https%3A%2F%2Fepicgames.com%2Fsite%2Faccount`);
  
    const { data } = await this.http.sendGet(
      'https://www.epicgames.com/account/resendEmailVerification',
      `${this.account.auth.tokenType} ${this.account.auth.accessToken}`,
    );
    
    return data.success;
  }

  /**
   * Enable two factor authentication.
   * @param {string} type `authenticator` or `email`
   * @param {(string|number|function)} twoFactorCode 
   */
  async enableTwoFactor(type, twoFactorCode) {

    const exchange = await this.account.auth.exchange();

    await this.http.sendGet(`https://accounts.epicgames.com/exchange?exchangeCode=${exchange.code}&redirectUrl=https%3A%2F%2Fepicgames.com%2Fsite%2Faccount`);
    await this.http.sendGet('https://www.epicgames.com/account/password');
    
    // let csrfToken = this.http.jar.getCookies('https://www.epicgames.com').find(cookie => cookie.key === 'csrfToken')
    //  || this.http.jar.getCookies('https://epicgames.com').find(cookie => cookie.key === 'csrfToken');
    // csrfToken = csrfToken.value;

    let xsrfToken = this.http.jar.getCookies('https://www.epicgames.com').find(cookie => cookie.key === 'XSRF-TOKEN')
     || this.http.jar.getCookies('https://epicgames.com').find(cookie => cookie.key === 'XSRF-TOKEN');
    xsrfToken = xsrfToken ? xsrfToken.value : null;

    await this.http.sendPost(
      'https://www.epicgames.com/account/v2/refresh-csrf',
      null,
      {},
      true,
      {
        'x-xsrf-token': xsrfToken,
      },
    );

    xsrfToken = this.http.jar.getCookies('https://www.epicgames.com').find(cookie => cookie.key === 'XSRF-AM-TOKEN')
     || this.http.jar.getCookies('https://epicgames.com').find(cookie => cookie.key === 'XSRF-AM-TOKEN');
    xsrfToken = xsrfToken.value;

    const {
      data: {
        verify: {
          otpauth,
          secret,
          challenge,
        },
      },
    } = await this.http.sendPost(
      'https://www.epicgames.com/account/v2/security/ajaxUpdateTwoFactorAuthSettings',
      null,
      {
        type,
        enabled: true,
      },
      true,
      {
        'x-csrf-token': '[object Object]',
        'x-requested-with': 'XMLHttpRequest',
        'x-xsrf-token': xsrfToken,
      },
    );

    let otp;
      
    switch (typeof twoFactorCode) {

      case 'string':
        otp = twoFactorCode;
        break;

      case 'number':
        otp = twoFactorCode;
        break;
          
      case 'function':
        otp = await twoFactorCode(secret, otpauth);
        break;

      default:
        throw new Error('`twoFactorCode` parameter must be `string`, `number` or `function`.');

    }

    // csrfToken = this.http.jar.getCookies('https://www.epicgames.com').find(cookie => cookie.key === 'csrfToken')
    //  || this.http.jar.getCookies('https://epicgames.com').find(cookie => cookie.key === 'csrfToken');
    // csrfToken = csrfToken.value;

    const { data } = await this.http.sendPost(
      'https://www.epicgames.com/account/v2/security/ajaxUpdateTwoFactorAuthSettings',
      null,
      {
        type: `${type}_challenge`,
        enabled: true,
        otp,
        challenge,
      },
      true,
      {
        'x-csrf-token': '[object Object]',
        'x-requested-with': 'XMLHttpRequest',
        'x-xsrf-token': xsrfToken,
      },
    );

    return data && data.isSuccess ? {
      otpauth,
      secret,
    } : false;
  }

  /**
   * Disable two factor authentication.
   * @param {string} type `authenticator` or `email`
   */
  async disableTwoFactor(type) {

    const exchange = await this.account.auth.exchange();

    await this.http.sendGet(`https://accounts.epicgames.com/exchange?exchangeCode=${exchange.code}&redirectUrl=https%3A%2F%2Fepicgames.com%2Fsite%2Faccount`);
    await this.http.sendGet('https://www.epicgames.com/account/password');
    
    // let csrfToken = this.http.jar.getCookies('https://www.epicgames.com').find(cookie => cookie.key === 'csrfToken')
    //  || this.http.jar.getCookies('https://epicgames.com').find(cookie => cookie.key === 'csrfToken');
    // csrfToken = csrfToken.value;

    let xsrfToken = this.http.jar.getCookies('https://www.epicgames.com').find(cookie => cookie.key === 'XSRF-TOKEN')
     || this.http.jar.getCookies('https://epicgames.com').find(cookie => cookie.key === 'XSRF-TOKEN');
    xsrfToken = xsrfToken ? xsrfToken.value : null;

    await this.http.sendPost(
      'https://www.epicgames.com/account/v2/refresh-csrf',
      null,
      {},
      true,
      {
        'x-xsrf-token': xsrfToken,
      },
    );

    xsrfToken = this.http.jar.getCookies('https://www.epicgames.com').find(cookie => cookie.key === 'XSRF-AM-TOKEN')
     || this.http.jar.getCookies('https://epicgames.com').find(cookie => cookie.key === 'XSRF-AM-TOKEN');
    xsrfToken = xsrfToken.value;
    
    const {
      data: {
        isSuccess,
      },
    } = await this.http.sendPost(
      'https://www.epicgames.com/account/v2/security/ajaxRemoveTwoFactorAuthMethod',
      null,
      {
        type,
      },
      true,
      {
        'x-csrf-token': '[object Object]',
        'x-requested-with': 'XMLHttpRequest',
        'x-xsrf-token': xsrfToken,
      },
    );

    return isSuccess;
  }

}

module.exports = Launcher;
