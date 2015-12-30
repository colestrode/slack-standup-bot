var _ = require('lodash')
  , q = require('q')
  , userIds = [] // persisted
  , users;

module.exports.init = function(bot) {
  // TODO read persisted list
  return q.all(_.map(userIds, _.partial(getUser, bot)))
    .then(function (us) {
      users = us;
    });
};

module.exports.add = function(bot, userId) {
  return getUser(bot, userId).then(function(user) {
    if (_.indexOf(userIds, userId) < 0) {
      userIds.push(userId);
      users.push(user);

      // TODO update persisted ID's
    }
    return user;
  });
};

module.exports.remove = function(userId) {
  var removedUser = _.remove(users, {id: userId});

  _.remove(userIds, function(uid) {
    return uid === userId;
  });

  // TODO update persisted ID's

  return q(removedUser.length ? removedUser[0] : undefined);
};

module.exports.list = function() {
  return q(users);
};

module.exports.get = function(userId) {
  return q(_.find(users, {id: userId}));
};

module.exports.exists = function(userId) {
  return q(module.exports.get(userId))
    .then(function(user) {
      return !!user;
    });
};

function getUser(bot, userId) {
  var info = q.nbind(bot.api.users.info, bot.api.users);

  return info({user: userId})
    .then(function (res) {
      return res.user;
    });
}