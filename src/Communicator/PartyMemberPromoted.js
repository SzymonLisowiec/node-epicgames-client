const User = require('../User');

class PartyMemberPromoted {

  constructor(communicator, data) {
    
    this.communicator = communicator;

    this.sender = new User(this.communicator.getClient(), data);

    this.partyId = data.partyId;

    this.member = new User(this.communicator.getClient(), data.member);
    this.leaderLeaving = data.leaderLeaving;
    
    this.time = data.time;
    
  }

}

module.exports = PartyMemberPromoted;
