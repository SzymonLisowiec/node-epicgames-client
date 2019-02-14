const Friend = require('./Friend');

class FriendRequest {

  constructor(client, data) {

    this.client = client;
    this.friend = new Friend(this.client, data);

    this.direction = data.direction;
    this.status = data.status;
    this.time = data.time;
    
  }

  async accept() {

    if (await Friend.invite(this.client, this.friend.id)) {
      this.status = 'ACCEPTED';
      return true;
    }

    return false;
  }

  async reject() {
    
    if (await this.friend.remove(this.friend.id)) {
      this.status = 'REJECTED';
      return true;
    }

    return false;
  }

}

module.exports = FriendRequest;
