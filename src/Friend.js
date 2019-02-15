const User = require('./User');

class Friend extends User {

  constructor(client, data) {
    super(client, data);

    this.status = data.status || 'UNDEFINED'; // UNDEFINED, PENDING, ACCEPTED, BLOCKED, REMOVED

    this.lastActionAt = data.time || this.lastActionAt || null;

    this.favorite = data.favorite || undefined;

  }

  static async invite(client, accountId) {

    if (await client.inviteFriend(accountId)) {

      return new this(client, {
        accountId,
        status: 'PENDING',
        lastActionAt: new Date(),
      });

    }

    return false;
  }

  async remove() {

    if (await this.client.removeFriend(this.id)) {

      this.status = 'REMOVED';

      this.lastActionAt = new Date();

      return true;
    }

    return false;
  }

}

module.exports = Friend;
