const Meta = require('./Meta');

class MemberMeta extends Meta {

  constructor(member, meta) {
    super();

    this.member = member;
    this.app = this.member.app;
    
    this.schema = {};

    if (meta) this.update(meta, true);

  }

}

module.exports = MemberMeta;
