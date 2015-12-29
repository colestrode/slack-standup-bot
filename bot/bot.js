var Botkit = require('botkit')
  , _ = require('lodash')
  , users = require('./model/users')
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
  bot.api.users.info({user: message.user}, function(err, res) {
    if(err) {
      return bot.reply(message, 'Oops! I wasn\'t able to add you right now, maybe try again in a minute');
    }
    var user = res.user;
    users.add(user);
    bot.reply(message, 'You\'re on the roster ' + user.name + ' :thumbsup:');
  });
});

// leave
controller.hears(['leave', 'quit'], 'direct_mention', function(bot, message) {
  var user = users.remove(message.user);
  if (user) {
    bot.reply(message, user.name + ' has left the team. Sorry to see you go!')
  } else {
    bot.reply(message, 'Um, this is awkward, but you weren\'t on the team to begin with :grimmace:');
  }
});

// kick/remove

// standup admin:
// start
// stop (have auto-stop when reach last user)

// list participants
controller.hears(['list', 'participants', 'members'], 'direct_mention', function(bot, message) {
  var users = _.pluck(users.list(), 'name');

  if (!users.length) {
    bot.reply(message, 'Nobody! I\'m all alone! :crying_cat_face:');
  } else {
    bot.reply(message, 'Current members: ' + _.pluck(users.list(), 'name').join(', '));
  }
});

// skip (current user)


// standup report
// notify next user
// conversation:
// * what did you do yesterday?
// * what are you doing today?
// * anything in your way?