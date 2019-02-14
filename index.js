/* eslint-disable global-require */

module.exports = {
  Client: require('./src/Client'),
  WaitingRoom: require('./src/WaitingRoom'),
  User: require('./src/User'),
  Communicator: require('./src/Communicator'),
  Endpoints: require('./resources/Endpoint'),

  EUserState: require('./enums/UserState'),
  EPartyPrivacy: require('./enums/PartyPrivacy'),
  EInputType: require('./enums/InputType'),
  EPlatform: require('./enums/Platform'),

};
