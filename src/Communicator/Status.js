const User = require('../User');
const Party = require('../Party');

class Status {

  constructor(communicator, data) {
        
    this.communicator = communicator;
    this.app = this.communicator.app;
    this.launcher = this.communicator.launcher;
    
    this.sender = new User(this.launcher, data);

    this.state = data.state;
    
    this.readStatus(data.status);
    
    this.time = new Date();

  }

  readStatus(rawStatus) {
    
    let status = {};

    if (rawStatus) {
      try {
        status = JSON.parse(rawStatus);
      } catch (err) {
        this.launcher.debug.print(`Communicator[${this.communicator.resource}]: Cannot parse status's JSON for presentence. (${rawStatus})`);
      }
    }

    this.status = status.Status || null;
    this.isPlaying = !!status.bIsPlaying;
    this.isJoinable = !!status.bIsJoinable;
    this.hasVoiceSupport = !!status.bHasVoiceSupport;
    this.sessionId = status.SessionId || null;
    this.properties = status.Properties || null;

  }

  async readParty() {
    const propertyKeys = Object.keys(this.properties);
    if (propertyKeys.length === 0) return null;
    const joinInfoKey = propertyKeys.find(key => /^party\.\joininfodata\.([0-9]{0,})\_j$/.test(key));
    const joinInfoData = this.properties[joinInfoKey];
  }

}

module.exports = Status;
