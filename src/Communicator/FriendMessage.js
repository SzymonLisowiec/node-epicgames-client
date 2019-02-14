const Friend = require('../Friend');

class FriendMessage {

  constructor(communicator, data) {

    this.communicator = communicator;
    this.friend = new Friend(this.communicator.getClient(), data);
    
    this.message = data.message;
    this.time = data.time;
    
  }

  async reply(message) {
    
    this.communicator.sendMessage(this.friend.id, message);

  }

}

module.exports = FriendMessage;
