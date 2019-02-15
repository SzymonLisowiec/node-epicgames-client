class User {

  constructor(client, data) {

    this.client = client;

    if (typeof data !== 'object') {

      if (data === 'me') {

        data = {
          accountId: this.client.account.id,
          displayName: this.client.account.displayName,
        };

      } else {

        data = {
          accountId: data,
        };

      }

    }

    this.id = data.accountId || data.id;

    if (!this.id) {
      throw new Error('Trying of initialize User without account id. Provided data above.');
    }

    this.jid = data.jid || null;

    if (!this.jid && this.client.communicator) {

      this.jid = `${this.id}@${this.client.communicator.host}`;
      if (data.xmppResource) this.jid = `${this.jid}/${data.xmppResource}`;

    }

    this.displayName = data.displayName || data.accountName || null;

    this.externalAuths = data.externalAuths || [];

  }

  update(data) {
    this.displayName = data.displayName || data.accountName || this.displayName;
    this.jid = data.jid;
    this.externalAuths = data.externalAuths || [];
  }

  async fetch() {
    let data = await this.client.getProfile(this.id);
    if (data) this.update(data);
  }

  async fetchDisplayName() {

    if (this.displayName) return this.displayName; // if we have name, no need to re-fetch

    await fetch();

    return this.displayName;
  }

  static async get(client, user) {

    if (typeof user === 'string' && client.isDisplayName(user)) {

      const account = await client.lookup(user);
      if (account) return new this(client, account);
      return false;

    }

    return new this(client, user);
  }

}

module.exports = User;
