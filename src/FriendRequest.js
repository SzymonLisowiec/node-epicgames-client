const Friend = require('./Friend');

class FriendRequest {

  constructor(launcher, data) {

    this.launcher = launcher;
    this.friend = new Friend(this.launcher, data);

    this.direction = data.direction;
    this.status = data.status;
    this.time = data.time;
    
  }

  async accept() {

    if (await Friend.invite(this.launcher, this.friend.id)) {
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
