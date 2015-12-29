var _ = require('lodash')
  , users = [];

module.exports.add = function(user) {
  if (_.indexOf(users, user) < 0) {
    users.push(user);
  }
};

module.exports.remove = function(userId) {
  var removed = _.remove(users, {id: userId});
  return removed.length ? removed[0] : undefined;
};

module.exports.list = function() {
  return users;
};

module.exports.exists = function(userId) {
  return _.findIndex(users, {id: userId}) >= 0;
};

