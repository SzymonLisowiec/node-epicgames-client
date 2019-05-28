class MemberConnection {

  constructor(member, connection) {
    this.member = member;
    this.id = connection.id;
    this.meta = connection.meta || {};
  }

}

module.exports = MemberConnection;
