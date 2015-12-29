var Botkit = require('Botkit')
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
  bot.api.users.info({user: message.user}, function(err, user) {
    if(err) {
      return bot.reply(message, 'Oops! I wasn\'t able to add you right now, maybe try again in a minute');
    }
    users.add(user);
    bot.reply(message, 'You\'re on the roster ' + user.name + ' :thumbsup:');
  });

});
// leave
// kick/remove

// standup admin:
// start
// stop (have auto-stop when reach last user)
// list participants
// skip (current user)


// standup report
// notify next user
// conversation:
// * what did you do yesterday?
// * what are you doing today?
// * anything in your way?