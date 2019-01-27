module.exports = Object.freeze({

	EULA_TRACKING: 'https://eulatracking-public-service-prod06.ol.epicgames.com/eulatracking/api/public/agreements/{{namespace}}',
    
    LAUNCHER_STATUS: 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/info/launcher',
	LAUNCHER_INFO: 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/Windows/x/EpicGamesLauncher',
	
	LOGIN_FRONTEND: 'https://accounts.launcher-website-prod07.ol.epicgames.com',

    OAUTH_TOKEN: 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token',
    OAUTH_EXCHANGE: 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/exchange',
    OAUTH_VERIFY: 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/verify',
    OAUTH_SESSIONS_KILL: 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/sessions/kill',
    
    DOMAINS: 'https://account-public-service-prod03.ol.epicgames.com/account/api/epicdomains/ssodomains',
    WAITING_ROOM: 'https://launcherwaitingroom-public-service-prod06.ol.epicgames.com/waitingroom/api/waitingroom',
    ACCOUNT: 'https://account-public-service-prod03.ol.epicgames.com/account/api/public/account',
    ACCOUNT_BY_NAME: 'https://account-public-service-prod03.ol.epicgames.com/account/api/public/account/displayName',

    FRIENDS: 'https://friends-public-service-prod06.ol.epicgames.com/friends/api/public/friends',
    FRIENDS_BLOCKLIST: 'https://friends-public-service-prod06.ol.epicgames.com/friends/api/public/blocklist',
    FRIENDS_RECENT_PLAYERS: 'https://friends-public-service-prod06.ol.epicgames.com/friends/api/public/list/{{namespace}}/{{account_id}}/recentPlayers',

    //TODO:
    ACCOUNT_PAYMENTS: 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/payment/accounts/{{account_id}}/billingaccounts/default',
    ACCOUNT_ENTITLEMENTS: 'https://entitlement-public-service-prod08.ol.epicgames.com/entitlement/api/account/{{account_id}}/entitlements', // ?start=0&count=5000 // returns array of account entitlements
    CATALOG: 'https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/namespace/{{namespace}}/items', // ?status=SUNSET%7CACTIVE&sortBy=creationDate&country=US&locale=pl-PL&start=0&count=1000
	ACCOUNT_EXTERNAL_AUTHS: 'https://account-public-service-prod03.ol.epicgames.com/account/api/public/account/{{account_id}}/externalAuths',
	ACCOUNT_METADATA: 'https://account-public-service-prod03.ol.epicgames.com/account/api/accounts/{{account_id}}/metadata',
	ACCOUNT_BILLING: 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/payment/accounts/{{account_id}}/billingaccounts/default',
	LAUNCHER_ASSETS: 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/Windows?label=Live', // label can be Live or Next at 2018-12-12
	CURRENCIES: 'https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/currencies', // ?start=0&count=100
	ACCOUNT_ENTITLEMENTS: 'https://entitlement-public-service-prod08.ol.epicgames.com/entitlement/api/account/{{account_id}}/entitlements', // ?start=0&count=5000
	FRIENDS_SETTINGS_EXTERNAL_SOURCES: 'https://friends-public-service-prod06.ol.epicgames.com/friends/api/v1/{{account_id}}/settings/externalSources/default', // instead default can be "steam"
	WALLET: 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/accounts/{{account_id}}/wallet', // ?currencyCode=PLN
	PRICEENGINE_OFFER: 'https://priceengine-public-service-ecomprod01.ol.epicgames.com/priceengine/api/shared/offers/price', // request data: method: POST, example body(json): {"accountId":"YOUR_ACCOUNT_ID","calculateTax":false,"lineOffers":[{"offerId":"b1b8c163a7f5444daf19260d2792ccdc","quantity":1}],"country":"PL"}
	LIGHTSWITCH_SERVICE_STATUS: 'https://lightswitch-public-service-prod06.ol.epicgames.com/lightswitch/api/service/bulk/status', // ?serviceId=Fortnite // returns status of servers, maintennces and more
	

    //'EpicLogin': 'https://launcher-website-prod07.ol.epicgames.com//epic-login',
    //'LoginPage': 'https://accounts.launcher-website-prod07.ol.epicgames.com//login/launcher',
    //'doLauncherPage': 'https://accounts.launcher-website-prod07.ol.epicgames.com/login/doLauncherLogin'
});