var usersModel = require('../model/users-model')
  , _ = require('lodash');

module.exports.use = function(controller) {
  // join
  controller.hears('join', 'direct_mention', function(bot, message) {
    return usersModel.add(message.user)
      .then(function(user) {
        bot.reply(message, 'You\'re on the roster ' + user.name + ' :thumbsup:');
      })
      .fail(function(err) {
        console.log(err);
        bot.reply(message, 'Oops! I wasn\'t able to add you right now, maybe try again in a minute');
      });
  });

  // leave
  controller.hears(['leave', 'quit'], 'direct_mention', function(bot, message) {
    return usersModel.remove(message.user)
      .then(function(user) {
        if (user) {
          bot.reply(message, user.name + ' has left the team. Sorry to see you go!');
        } else {
          bot.reply(message, 'Um, this is awkward, but you weren\'t on the team to begin with :grimacing:');
        }
      })
      .fail(function(err) {
        console.log(err);
        bot.reply(message, 'Oops! I wasn\'t able to remove you right now, maybe try again in a minute');
      });
  });

  // kick/remove
  controller.hears(['kick (.*)', 'remove (.*)'], 'direct_mention', function(bot, message) {
    var userId = message.match[1]
      , promise;

    if (userId.indexOf('<@') === 0) {
      // known user who is referenced by @username will be resolved to <@userid>
      userId = userId.replace('<', '').replace('@', '').replace('>', '');
      promise = usersModel.remove(userId);
    } else {
      // handles unknown @username and bare username
      userId = userId.replace('@', '');
      promise = usersModel.removeByName(userId);
    }

    return promise.then(function(user) {
      if (user) {
        bot.reply(message, user.name + ' has been removed from the team. Sorry to see them go!');
      } else {
        bot.reply(message, 'Um, this is awkward, but they aren\'t on the team :grimacing:');
      }
    })
    .fail(function(err) {
      console.log(err);
      bot.reply(message, 'Oops! I wasn\'t able to remove them right now, maybe try again in a minute');
    });
  });

  // list participants
  controller.hears(['list', 'participants', 'members', 'team'], 'direct_mention', function(bot, message) {
    var users = usersModel.list();

    if (!users.length) {
      bot.reply(message, 'Nobody! I\'m all alone! :crying_cat_face:');
    } else {
      bot.reply(message, 'Current members: ' + _.map(users, 'name').join(', '));
    }
  });
};
