const User = require('./User');

class Friend extends User {

  constructor(launcher, data) {
    super(launcher, data);

    this.status = data.status || 'UNDEFINED'; // UNDEFINED, PENDING, ACCEPTED, BLOCKED, REMOVED

    this.lastActionAt = data.time || this.lastActionAt || null;

    this.favorite = data.favorite || undefined;

  }

  static async invite(launcher, accountId) {

    if (await launcher.inviteFriend(accountId)) {

      return new this(launcher, {
        accountId,
        status: 'PENDING',
        lastActionAt: new Date(),
      });

    }

    return false;
  }

  async remove() {

    if (await this.launcher.removeFriend(this.id)) {

      this.status = 'REMOVED';

      this.lastActionAt = new Date();

      return true;
    }

    return false;
  }

}

module.exports = Friend;
