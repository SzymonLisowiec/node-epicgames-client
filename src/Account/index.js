const ENDPOINT = require('../../resources/Endpoint');

const Auth = require('./Auth');

class Account {

  constructor(client) {

    this.client = client;
    this.id = null;

    this.auth = null;

  }

  async fetch() {

    try {
            
      const { data } = await this.client.http.sendGet(
        `${ENDPOINT.ACCOUNT}/${this.id}`,
        `${this.auth.tokenType} ${this.auth.accessToken}`,
      );
            
      this.displayName = data.displayName;
      this.name = data.displayName;
      this.firstName = data.name;
      this.lastName = data.lastName;
      this.email = data.email;
      this.failedLoginAttempts = data.failedLoginAttempts;
      this.lastLogin = new Date(data.lastLogin);
      this.numberOfDisplayNameChanges = data.numberOfDisplayNameChanges;
      this.ageGroup = data.ageGroup;
      this.headless = data.headless;
      this.country = data.country;
      this.preferredLanguage = data.preferredLanguage;

      return data;

    } catch (err) {

      this.client.debug.print(new Error(err));

    }

    return false;
  }

  async authorize(twoFactorCode) {

    this.auth = new Auth(this.client);
    const auth = await this.auth.auth(twoFactorCode);

    if (!auth) return false;

    this.id = this.auth.accountId;
    await this.fetch();
    
    return true;
  }

  async register(options) {
    
    this.auth = new Auth(this.client);
    const auth = await this.auth.register(options);

    if (!auth) return false;

    this.id = this.auth.accountId;
    await this.fetch();
    
    return true;
  }

}

module.exports = Account;
