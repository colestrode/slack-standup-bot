var _ = require('lodash')
  , q = require('q')
  , getIds
  , saveIds
  , userIdsKey = 'userids'
  , userIds = [] // persisted
  , users = [];

module.exports.init = function(controller, bot) {
  getIds = q.nbind(controller.storage.teams.get, controller.storage.teams);
  saveIds = q.nbind(controller.storage.teams.save, controller.storage.teams);

  return getIds(userIdsKey)
    .then(function(uids) {
      if (uids) {
        userIds = uids.userIds || [];
      }
    })
    .finally(function() {
      return q.all(_.map(userIds, _.partial(getUser, bot)))
        .then(function (us) {
          users = us || [];
        });
    })
};

module.exports.add = function(bot, userId) {
  return getUser(bot, userId)
    .then(function(user) {
      if (_.indexOf(userIds, userId) < 0) {
        userIds.push(userId);
        users.push(user);

        saveIds({id: userIdsKey, userIds: userIds});
      }
      return user;
    });
};

module.exports.remove = function(userId) {
  var removedUser = _.remove(users, {id: userId});

  _.remove(userIds, function(uid) {
    return uid === userId;
  });

  saveIds({id: userIdsKey, userIds: userIds});
  return q(removedUser.length ? removedUser[0] : undefined);
};

module.exports.removeByName = function(username) {
  var user = _.find(users, {name: username});

  if(!user) {
    return q();
  }

  return module.exports.remove(user.id);
};

module.exports.list = function() {
  return users;
};

module.exports.get = function(userId) {
  return _.find(users, {id: userId});
};

module.exports.exists = function(userId) {
  return !!module.exports.get(userId);
};

module.exports.iterator = function() {
  var usersList = _.sortBy(_.cloneDeep(users), 'name') // cloning prevents the list being modified during iteration
    , length = usersList.length
    , current = -1;

  return {
    next: function() {
      current++;
      return (current < length) ? usersList[current] : undefined;
    },

    hasNext: function() {
      return (current + 1) < length;
    }
  };
};

function getUser(bot, userId) {
  var info = q.nbind(bot.api.users.info, bot.api.users);

  return info({user: userId})
    .then(function (res) {
      return res.user;
    });
}
