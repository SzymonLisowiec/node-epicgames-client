module.exports = Object.freeze({
    
    LAUNCHER_STATUS: 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/info/launcher',
    LAUNCHER_INFO: 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/Windows/x/EpicGamesLauncher',

    OAUTH_TOKEN: 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token',
    OAUTH_EXCHANGE: 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/exchange',
    OAUTH_VERIFY: 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/verify',
    
    DOMAINS: 'https://account-public-service-prod03.ol.epicgames.com/account/api/epicdomains/ssodomains',
    WAITING_ROOM: 'https://launcherwaitingroom-public-service-prod06.ol.epicgames.com/waitingroom/api/waitingroom',
    ACCOUNT: 'https://account-public-service-prod03.ol.epicgames.com/account/api/public/account',
    ACCOUNT_BY_NAME: 'https://account-public-service-prod03.ol.epicgames.com/account/api/public/account/displayName',

    FRIENDS: 'https://friends-public-service-prod06.ol.epicgames.com/friends/api/public/friends',
    FRIENDS_BLOCKLIST: 'https://friends-public-service-prod06.ol.epicgames.com/friends/api/public/blocklist',

    //TODO:
    FRIENDS_RECENT_PLAYERS: 'https://friends-public-service-prod06.ol.epicgames.com/friends/api/public/list/ut/{{account_id}}/recentPlayers',
    ACCOUNT_PAYMENTS: 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/payment/accounts/{{account_id}}/billingaccounts/default',
    ACCOUNT_ENTITLEMENTS: 'https://entitlement-public-service-prod08.ol.epicgames.com/entitlement/api/account/{{account_id}}/entitlements', //?start=0&count=5000 //returns array of account entitlements
    CATALOG: 'https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/namespace/{{namespace}}/items' //?status=SUNSET%7CACTIVE&sortBy=creationDate&country=US&locale=pl-PL&start=0&count=1000
    
    //'EpicLogin': 'https://launcher-website-prod07.ol.epicgames.com//epic-login',
    //'LoginPage': 'https://accounts.launcher-website-prod07.ol.epicgames.com//login/launcher',
    //'doLauncherPage': 'https://accounts.launcher-website-prod07.ol.epicgames.com/login/doLauncherLogin'
});