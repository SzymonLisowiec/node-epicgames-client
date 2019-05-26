const ENDPOINT = require('../../resources/Endpoint');

class AccountAuth {

  constructor(launcher) {

    this.launcher = launcher;

  }

  async auth() {

    try {

      const { data } = await this.launcher.http.sendPost(ENDPOINT.OAUTH_TOKEN, 'launcher', {
        grant_type: 'client_credentials',
        token_type: 'eg1',
      });

      if (data) {

        this.accessToken = data.access_token;
        this.expiresIn = data.expires_in;
        this.expiresAt = data.expires_at;
        this.tokenType = data.token_type;
        this.clientId = data.client_id;
        this.internalClient = data.internal_client;
        this.clientService = data.client_service;

        return true;

      }

    } catch (err) {

      this.launcher.debug.print(new Error(err));

    }
    
    return false;
  }

}

module.exports = AccountAuth;
