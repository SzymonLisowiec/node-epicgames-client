const { readFileSync: read } = require('fs');

module.exports = Object.freeze({
  get EVALUATE_CODE_QUERY() { return read(`${__dirname}/graphql/queries/evaluateCodeQuery.graphql`).toString(); },
  get REDEEM_CODE_MUTATION() { return read(`${__dirname}/graphql/mutations/redeemCodeMutation.graphql`).toString(); },
});
