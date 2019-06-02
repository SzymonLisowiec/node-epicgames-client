const Events = require('events');
const Launcher = require('./Client');

class Application extends Events {

  static get Communicator() { return Launcher.Communicator; }

  static get Party() { return Launcher.Party; }

  static get PartyInvitation() { return Launcher.PartyInvitation; }
  
  static get PartyJoinRequest() { return Launcher.PartyJoinRequest; }

  static get PartyMeta() { return Launcher.PartyMeta; }

  static get PartyMember() { return Launcher.PartyMember; }

  static get PartyMemberConfirmation() { return Launcher.PartyMemberConfirmation; }

  static get PartyMemberConnection() { return Launcher.PartyMemberConnection; }

  static get PartyMemberMeta() { return Launcher.PartyMemberMeta; }

  constructor(launcher, config) {
    super();
    
    this.launcher = launcher;

    this.config = {
      
      partyMemberConfirmation: this.launcher.config.partyMemberConfirmation,
      useWaitingRoom: this.launcher.config.useWaitingRoom,
      useCommunicator: this.launcher.config.useCommunicator,
      http: this.launcher.config.http,
      platform: this.launcher.config.platform,
      createPartyOnStart: this.launcher.config.createPartyOnStart,
      defaultPartyConfig: this.launcher.config.defaultPartyConfig,
      autoPresenceUpdating: this.launcher.config.autoPresenceUpdating,

      ...config,

    };

    this.Communicator = Application.Communicator;
    this.Party = Application.Party;
    this.PartyInvitation = Application.PartyInvitation;
    this.PartyJoinRequest = Application.PartyJoinRequest;
    this.PartyMeta = Application.PartyMeta;
    this.PartyMember = Application.PartyMember;
    this.PartyMemberConfirmation = Application.PartyMemberConfirmation;
    this.PartyMemberConnection = Application.PartyMemberConnection;
    this.PartyMemberMeta = Application.PartyMemberMeta;

  }

  async init() {
    return true;
  }

  async login() {
    return true;
  }

}

module.exports = Application;
