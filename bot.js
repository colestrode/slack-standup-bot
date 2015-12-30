var Botkit = require('botkit')
  , _ = require('lodash')
  , usersModel = require('./model/users-model')
  , usersController = require('./controller/users-controller')
  , summaryController = require('./controller/summary-controller')
  , controller;

controller = Botkit.slackbot({
  debug: false
});

// connect the bot to a stream of messages
controller.spawn({
  token: process.env.SLACK_API_TOKEN
}).startRTM(function(bot) {
  usersModel.init(bot);
});

usersController.use(controller);
summaryController.use(controller);

// standup admin: can't modify users during standup
// start
// stop (have auto-stop when reach last user)



// skip (current user)


// standup report
// notify next user
// conversation:
// * what did you do yesterday?
// * what are you doing today?
// * anything in your way?