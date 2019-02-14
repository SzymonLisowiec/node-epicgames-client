const User = require('../User');

class Status {

  constructor(communicator, data) {
        
    this.communicator = communicator;
    this.client = this.communicator.getClient();
    
    this.sender = new User(this.client, data);

    this.state = data.state;

    try {
      const [, app] = data.jid.resource.toLowerCase().split(':');
      this.app = app;
    } catch (err) {
      this.app = null;
    }
    
    this.readStatus(data.status);
        
    this.time = new Date();

  }

  readStatus(rawStatus) {
    
    let status = {};

    if (rawStatus) {
      try {
        status = JSON.parse(rawStatus);
      } catch (err) {
        this.client.debug.print(`Communicator[${this.communicator.resource}]: Cannot parse status's JSON for presentence. (${rawStatus})`);
      }
    }

    this.status = status.Status || null;
    this.isPlaying = !!status.bIsPlaying;
    this.isJoinable = !!status.bIsJoinable;
    this.hasVoiceSupport = !!status.bHasVoiceSupport;
    this.sessionId = status.SessionId || null;
    this.properties = status.Properties || null;

  }

}

module.exports = Status;
