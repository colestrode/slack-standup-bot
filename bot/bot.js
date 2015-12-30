var Botkit = require('botkit')
  , _ = require('lodash')
  , usersModel = require('./model/users')
  , controller;

controller = Botkit.slackbot({
  debug: false
});

// connect the bot to a stream of messages
controller.spawn({
  token: process.env.SLACK_API_TOKEN
}).startRTM();

// user management:

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
  usersModelre.remove(message.user)
    .then(function(user) {
      if (user) {
        bot.reply(message, user.name + ' has left the team. Sorry to see you go!')
      } else {
        bot.reply(message, 'Um, this is awkward, but you weren\'t on the team to begin with :grimmace:');
      }
    });
});

// kick/remove
controller.hears(['kick (.*)'], 'direct_mention', function(bot, message) {
  console.log(message);
});


// standup admin:
// start
// stop (have auto-stop when reach last user)

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

// skip (current user)


// standup report
// notify next user
// conversation:
// * what did you do yesterday?
// * what are you doing today?
// * anything in your way?