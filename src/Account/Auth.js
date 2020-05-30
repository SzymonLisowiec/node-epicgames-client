const Cheerio = require('cheerio');
const Readline = require('readline');
const ENDPOINT = require('../../resources/Endpoint');
const FunCaptchaKeys = require('../../resources/FunCaptchaKeys');
const FunCaptchaFingerPrint = require('./FunCaptchaFingerPrint');

const Prompt = Readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

class AccountAuth {

  constructor(launcher) {
    
    this.launcher = launcher;
    this.tokenTimeout = null;
    this.token = null;
    
  }

  analytics(strategyFlags) {
    return this.launcher.http.sendGet(`${ENDPOINT.LOGIN_FRONTEND}/api/analytics`, null, null, true, {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Epic-Strategy-Flags': strategyFlags || '',
      Referer: `${ENDPOINT.LOGIN_FRONTEND}/login`,
    });
  }

  async login(credentials, strategyFlags) {
    await this.getXSRF(strategyFlags);
    try {
      await this.launcher.http.sendPost(`${ENDPOINT.LOGIN_FRONTEND}/api/login`, null, {
        email: credentials.email,
        password: credentials.password,
        rememberMe: this.launcher.config.rememberLastSession || false,
        captcha: credentials.captcha || '',
      }, true, {
        'X-XSRF-TOKEN': this.token,
      });
    } catch (error) {
      if (error.response) {
        switch (error.response.statusCode) {
          case 409:
            await this.login(credentials, strategyFlags);
            break;

          case 431: {
            const method = error.response.body.metadata.twoFactorMethod;
            const twoFactorCode = await this.getTwoFactorCode(method, credentials.twoFactorCode);
            await this.sendTwoFactor(method, twoFactorCode, strategyFlags);
          } break;
          
          default:
            throw new Error(`Unknown auth error: ${error.message}`);
        }
      }
    }
  }

  async sendTwoFactor(method, twoFactorCode, strategyFlags) {
    await this.getXSRF(strategyFlags);
    return this.launcher.http.sendPost(`${ENDPOINT.LOGIN_FRONTEND}/api/login/mfa`, null, {
      code: twoFactorCode,
      method,
      rememberDevice: false,
    }, true, {
      'X-XSRF-TOKEN': this.token,
    });
  }

  authenticate(strategyFlags) {
    return this.launcher.http.sendGet(`${ENDPOINT.LOGIN_FRONTEND}/api/authenticate`, null, null, true, {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Epic-Strategy-Flags': strategyFlags || '',
      Referer: `${ENDPOINT.LOGIN_FRONTEND}/login`,
    });
  }

  async exchangeIdServiceCode(strategyFlags) {
    await this.getXSRF(strategyFlags);
    return this.launcher.http.sendPost(`${ENDPOINT.LOGIN_FRONTEND}/api/exchange/generate`, null, null, true, {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Epic-Strategy-Flags': strategyFlags || '',
      'X-Epic-Event-Action': 'login',
      'X-Epic-Event-Category': 'login',
      'X-XSRF-TOKEN': this.token,
      Referer: `${ENDPOINT.LOGIN_FRONTEND}/login`,
    });
  }

  async getReputation() {
    const { data } = await this.launcher.http.sendGet(`${ENDPOINT.LOGIN_FRONTEND}/api/reputation`, null, null, true, {
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `${ENDPOINT.LOGIN_FRONTEND}/login`,
    });
    return data;
  }

  async resolveCaptcha(reputation, credentials, action) {
    if (!reputation || !reputation.verdict) return;
    switch (reputation.verdict) {
      case 'arkose': {
        if (typeof credentials.captcha !== 'function') {
          return;
        }
        const publicKey = FunCaptchaKeys[action];
        if (!publicKey) {
          throw new Error(`Not found FunCaptcha key for action ${action}`);
        }
        const { data: captchaData } = await this.launcher.http.sendPost(`${ENDPOINT.FUNCAPTCHA}/fc/gt2/public_key/${publicKey}`, null, {
          bda: FunCaptchaFingerPrint(),
          public_key: publicKey,
          site: ENDPOINT.FUNCAPTCHA,
          userbrowser: this.launcher.http.getUserAgent(),
          simulate_rate_limit: 0,
          simulated: 0,
          language: 'en',
          rnd: Math.random(),
          'data[blob]': reputation.arkose_data.blob,
        });
        credentials.captcha = await credentials.captcha(reputation, captchaData, {
          publicKey,
          arkoseUrl: ENDPOINT.FUNCAPTCHA,
          pageUrl: `${ENDPOINT.LOGIN_FRONTEND}/${action}`,
          userAgent: this.launcher.http.getUserAgent(),
        });
      } break;
      case 'allow':
        return;
      default:
        this.launcher.debug.print(`Unknown reputation verdict: ${reputation.verdict}`);
    }
  }

  async auth(credentials) {
    try {
      this.launcher.debug.print('Initializing account authentication...');
      const strategyFlags = 'guardianEmailVerifyEnabled=false;guardianEmbeddedDocusignEnabled=true;registerEmailPreVerifyEnabled=false;unrealEngineGamingEula=true';
      let exchangeCode = null;
      
      try {
        if (!this.launcher.config.rememberLastSession) {
          throw new Error('Remembering last session is disabled.');
        }
        const { data: exchangeCodeData } = await this.exchangeIdServiceCode(strategyFlags);
        exchangeCode = exchangeCodeData.code;
      } catch (error) {
        await this.launcher.http.sendGet(`${ENDPOINT.LOGIN_FRONTEND}/login`);
        const reputation = await this.getReputation();
        await this.launcher.http.sendGet(`${ENDPOINT.LOGIN_FRONTEND}/api/location`, null, null, true, {
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${ENDPOINT.LOGIN_FRONTEND}/login`,
        });
        await this.authenticate();
        await this.analytics();
        await this.resolveCaptcha(reputation, credentials, 'login');
        
        this.token = await this.getXSRF(strategyFlags);
        
        this.launcher.debug.print('Account logging...');
        await this.login(credentials, strategyFlags);
        
        await this.launcher.http.sendGet(`${ENDPOINT.LOGIN_FRONTEND}/api/redirect`, null, null, true, {
          'X-Requested-With': 'XMLHttpRequest',
          'X-Epic-Strategy-Flags': strategyFlags,
          Referer: `${ENDPOINT.LOGIN_FRONTEND}/login`,
        });

        await this.authenticate(strategyFlags);
        const { data: exchangeCodeData } = await this.exchangeIdServiceCode(strategyFlags);
        exchangeCode = exchangeCodeData.code;
      }

      if (!exchangeCode) throw new Error('[Account Authorization] Cannot get exchange code!');
      return this.authWithExchangeCode(exchangeCode);
    } catch (err) {
      throw err;
    }
  }
  
  async authWithExchangeCode (exchangeCode) {
    try {
      this.launcher.debug.print('Exchanging code...');
      const authData = await this.exchangeCode(exchangeCode);
      
      if (!authData) throw new Error('[Account Authorization] Cannot exchange code and receive authData!');
      this.setAuthParams(authData);
      this.setTokenTimeout();
      
      const { code: exchangeCodeForManageAccount } = await this.exchange();
      await this.launcher.http.sendGet(`${ENDPOINT.LOGIN_FRONTEND}/exchange?exchangeCode=${exchangeCodeForManageAccount}&redirectUrl=https%3A%2F%2Fwww.epicgames.com%2Fsite%2Faccount`);

      return true;
    } catch (err) {
      throw err;
    }
  }

  async register(/* options */) {
    throw new Error('Auth.register() is outdated, will updated in future...');
    // try {

    //   const token = await this.getXSRF('register');
      
    //   const { data } = await this.launcher.http.sendPost(
    //     `${ENDPOINT.LOGIN_FRONTEND}/register/doLauncherRegister`,
    //     'launcher',
    //     {
    //       fromForm: 'yes',
    //       location: '/location',
    //       authType: null,
    //       client_id: this.launcher.auth.clientId,
    //       redirectUrl: `${ENDPOINT.LOGIN_FRONTEND}/login/showPleaseWait?client_id=${this.launcher.auth.clientId}&rememberEmail=false`,
    //       country: options.country,
    //       name: options.firstName,
    //       lastName: options.lastName,
    //       displayName: options.displayName,
    //       email: options.email,
    //       password: options.password,
    //       'g-recaptcha-response': options.recaptchaResponse,
    //       termsAgree: 'yes',
    //       register: 'sign in',
    //     }, true, {
    //       'X-XSRF-TOKEN': token,
    //     },
    //   );
      
    //   const $ = Cheerio.load(data);
    //   const fieldValidationErrorElements = $('label.fieldValidationError');
    //   let generalExceptionError = $('.errorCodes.generalExceptionError');

    //   if (generalExceptionError.length) {
    //     generalExceptionError = generalExceptionError.eq(0).text().trim();
    //     throw new Error(`Error while registration. Message: ${generalExceptionError}`);
    //   }

    //   if (fieldValidationErrorElements.length) {
    //     throw new Error(`Error while registration. Field: ${fieldValidationErrorElements.eq(0).attr('for')} Message: ${fieldValidationErrorElements.eq(0).text()}`);
    //   }

    //   /**
    //    * Reading exchange code from redirected "please wait" page
    //    */
    //   const exchangeCode = await this.getExchangeCode(data.redirectURL);
    //   if (!exchangeCode) throw new Error('[Account Authorization] Cannot get exchange code!');
      
    //   /**
    //    * Exchanging code on token "eg1"
    //    */
    //   const authData = await this.exchangeCode(exchangeCode);
    //   if (!authData) throw new Error('[Account Authorization] Cannot exchange code and receive authData!');
      
    //   /**
    //    * Ending auth process
    //    */
    //   this.setAuthParams(authData);
    //   this.setTokenTimeout();

    //   return true;

    // } catch (err) {
        
    //   this.launcher.debug.print(err);

    // }

    // return false;
  }

  async getTwoFactorCode(method, twoFactorCode) {
    if (!twoFactorCode) {
      return new Promise((resolve) => {
        Prompt.question(`Enter two factor code (${method}): `, resolve);
      });
    }
    switch (typeof twoFactorCode) {

      case 'string':
        return twoFactorCode;

      case 'number':
        return twoFactorCode;
          
      case 'function':
        return twoFactorCode();

      default:
        throw new Error('`twoFactorCode` parameter must be `string`, `number` or `function`.');

    }
  }

  async submitTwoFactorCode(token, twoFactorFormElement, twoFactorCode) {

    const twoFactorForm = {
      challenge: twoFactorFormElement.find('input[name="challenge"]').val(),
      mfaMethod: twoFactorFormElement.find('input[name="mfaMethod"]').val(),
      alternateMfaMethods: twoFactorFormElement.find('input[name="alternateMfaMethods"]').val(),
      displayName: twoFactorFormElement.find('input[name="epic_username"]').val(),
      hideMessage: twoFactorFormElement.find('input[name="hideMessage"]').val(),
      linkExtAuth: twoFactorFormElement.find('input[name="linkExtAuth"]').val(),
      authType: twoFactorFormElement.find('input[name="authType"]').val(),
      clientId: twoFactorFormElement.find('input[name="client_id"]').val(),
      redirectUrl: twoFactorFormElement.find('input[name="redirectUrl"]').val(),
      rememberMe: twoFactorFormElement.find('input[name="rememberMe"]').val(),
    };

    if (!twoFactorCode) {

      twoFactorForm.twoFactorCode = await new Promise((resolve) => {
        Prompt.question(`Enter two factor code (${twoFactorForm.mfaMethod}): `, resolve);
      });

    } else {
      
      switch (typeof twoFactorCode) {

        case 'string':
          twoFactorForm.twoFactorCode = twoFactorCode;
          break;

        case 'number':
          twoFactorForm.twoFactorCode = twoFactorCode;
          break;
          
        case 'function':
          twoFactorForm.twoFactorCode = await twoFactorCode();
          break;

        default:
          throw new Error('`twoFactorCode` parameter must be `string`, `number` or `function`.');

      }

    }

    const { data } = await this.launcher.http.sendPost(
      `${ENDPOINT.LOGIN_FRONTEND}/login/doTwoFactor`
      + `?client_id=${this.launcher.auth.clientId}`,
      null,
      twoFactorForm,
      false,
      {
        'X-XSRF-TOKEN': this.launcher.http.jar.getCookies(`${ENDPOINT.LOGIN_FRONTEND}/login/doLauncherLogin`).find(cookie => cookie.key === 'XSRF-TOKEN').value,
      },
    );

    const $ = Cheerio.load(data);
    const errorCodesElement = $('.errorCodes');
    const fieldValidationErrorElement = $('label[for="twoFactorCode"].fieldValidationError');
    
    if (errorCodesElement.length) {

      // eslint-disable-next-line no-console
      console.log(`Error: ${errorCodesElement.text().trim()}`);
      return this.submitTwoFactorCode(token, $('#twoFactorForm'), twoFactorCode);

    }
    
    if (fieldValidationErrorElement.length) {

      // eslint-disable-next-line no-console
      console.log(`Error: ${fieldValidationErrorElement.text().trim()}`);
      return this.submitTwoFactorCode(token, $('#twoFactorForm'));
      
    }

    return JSON.parse(data);
  }

  async getXSRF(strategyFlags) {
    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Epic-Strategy-Flags': strategyFlags || '',
      Referer: `${ENDPOINT.LOGIN_FRONTEND}/login`,
    };
    if (this.token) {
      headers['X-XSRF-TOKEN'] = this.token;
    }
    await this.launcher.http.sendGet(`${ENDPOINT.LOGIN_FRONTEND}/api/csrf`, null, null, true, headers);
    if (!this.token) {
      await this.analytics(strategyFlags);
    }
    this.token = this.launcher.http.jar.getCookies(`${ENDPOINT.LOGIN_FRONTEND}`).find(cookie => cookie.key === 'XSRF-TOKEN').value;
  }

  async getExchangeCode(url) {
    
    const { response: { body } } = await this.launcher.http.sendGet(url, 'launcher', {}, false);
    
    const regex = /com\.epicgames\.account\.web\.widgets\.loginWithExchangeCode\('(.*)'(.*?)\)/g;
    const matches = regex.exec(body);

    return matches[1] || false;
  }

  async exchangeCode(exchangeCode) {

    const { data } = await this.launcher.http.sendPost(ENDPOINT.OAUTH_TOKEN, 'launcher', {
      grant_type: 'exchange_code',
      exchange_code: exchangeCode,
      token_type: 'eg1',
      includePerms: false, // Account's permissions
    });
    
    return data || false;
  }

  async exchange() {
    
    try {
      
      const { data } = await this.launcher.http.sendGet(
        ENDPOINT.OAUTH_EXCHANGE,
        `${this.tokenType} ${this.accessToken}`,
      );
        
      if (data) {
        
        return data;
    
      }

    } catch (err) {
      
      this.launcher.debug.print(new Error(err));

    }
    
    return false;
  }

  async doRefreshToken() {

    this.launcher.debug.print('Refreshing account\'s token...');

    try {

      const { data } = await this.launcher.http.sendPost(ENDPOINT.OAUTH_TOKEN, 'launcher', {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        includePerms: false, // Account's permissions
      });
      
      if (data) {

        this.setAuthParams(data);
        this.setTokenTimeout();

        this.launcher.emit('access_token_refreshed');

        this.launcher.debug.print('Account\'s token refreshed.');
        
        if (this.launcher.communicator) {
    
          await this.launcher.communicator.disconnect();
          await this.launcher.communicator.connect();
          
          this.launcher.debug.print('Communicator: Reconnected with new account\'s access token.');
    
        }

        return true;
    
      }

    } catch (err) {

      this.launcher.debug.print(new Error(err));

    }

    return false;
  }

  setAuthParams(data) {
    
    this.accessToken = data.access_token;
    this.expiresIn = data.expires_in;
    this.expiresAt = data.expires_at;
    this.tokenType = data.token_type;
    this.refreshToken = data.refresh_token;
    this.refreshExpires = data.refresh_expires;
    this.refreshExpiresAt = data.refresh_expires_at;
    this.accountId = data.account_id;
    this.clientId = data.client_id;
    this.internalClient = data.internal_client;
    this.clientService = data.client_service;
    this.lastPasswordValidation = data.lastPasswordValidation;
    this.app = data.app;
    this.inAppId = data.in_app_id;
    this.deviceId = data.device_id;

  }

  setTokenTimeout() {
    
    if (this.tokenTimeout) clearTimeout(this.tokenTimeout);

    this.tokenTimeout = setTimeout(() => {
      this.doRefreshToken();
    }, (this.expiresIn - 180) * 1000);

  }

}

module.exports = AccountAuth;
