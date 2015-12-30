var usersModel = require('../model/users-model')
  , _ = require('lodash');

module.exports.use = function(controller) {
  // join
  controller.hears('join', 'direct_mention', function(bot, message) {
    return usersModel.add(bot, message.user)
      .then(function(user) {
        bot.reply(message, 'You\'re on the roster ' + user.name + ' :thumbsup:');
      })
      .fail(function(err) {
        console.log(err);
        return bot.reply(message, 'Oops! I wasn\'t able to add you right now, maybe try again in a minute');
      });
  });

  // leave
  controller.hears(['leave', 'quit'], 'direct_mention', function(bot, message) {
    usersModel.remove(message.user)
      .then(function(user) {
        if (user) {
          bot.reply(message, user.name + ' has left the team. Sorry to see you go!')
        } else {
          bot.reply(message, 'Um, this is awkward, but you weren\'t on the team to begin with :grimacing:');
        }
      });
  });

  // kick/remove
  controller.hears(['kick (.*)', 'remove (.*)'], 'direct_mention', function(bot, message) {
    var userId = message.match[1]
      , promise;

    if(!userId) {
      return bot.reply(message, 'I\'m not sure who to remove... try `remove @user`');
    }

    if(userId.indexOf('<@') === 0) {
      userId = userId.replace('<', '').replace('@', '').replace('>', '');
      promise = usersModel.remove(userId);
    } else {
      userId = userId.replace('@', '');
      promise = usersModel.removeUserByName(userId);
    }

    promise.then(function(user) {
      if (user) {
        bot.reply(message, user.name + ' has been removed from the team. Sorry to see them go!')
      } else {
        bot.reply(message, 'Um, this is awkward, but ' + userId + ' isn\'t on the team :grimacing:');
      }
    });
  });

  // list participants
  controller.hears(['list', 'participants', 'members'], 'direct_mention', function(bot, message) {
    usersModel.list()
      .then(function(users) {
        if (!users.length) {
          bot.reply(message, 'Nobody! I\'m all alone! :crying_cat_face:');
        } else {
          bot.reply(message, 'Current members: ' + _.pluck(users, 'name').join(', '));
        }
      });
  });
};