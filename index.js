/* eslint-disable global-require */

module.exports = {
  
  Client: require('./src/Client'),
  Launcher: require('./src/Client'),
  WaitingRoom: require('./src/WaitingRoom'),
  User: require('./src/User'),
  Endpoints: require('./resources/Endpoint'),
  Application: require('./src/Application'),

  EUserState: require('./enums/UserState'),
  EInputType: require('./enums/InputType'),
  EPlatform: require('./enums/Platform'),
  EPartyPrivacy: require('./enums/PartyPrivacy'),

};
