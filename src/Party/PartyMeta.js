const Meta = require('./Meta');

class PartyMeta extends Meta {

  constructor(party, meta) {
    super();

    this.party = party;
    this.app = this.party.app;
    
    this.lastPushedSchema = {};
    this.schema = {};

    if (meta) this.update(meta, true);

  }
  
}

module.exports = PartyMeta;
