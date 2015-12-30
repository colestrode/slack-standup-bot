var Botkit = require('botkit')
  , _ = require('lodash')
  , usersModel = require('./model/users-model')
  , standupModel = require('./model/standup-model')
  , usersController = require('./controller/users-controller')
  , summaryController = require('./controller/summary-controller')
  , standupController = require('./controller/standup-controller')
  , controller;

controller = Botkit.slackbot({
  debug: false
});

// connect the bot to a stream of messages
controller.spawn({
  token: process.env.SLACK_API_TOKEN
}).startRTM(function(bot) {
  usersModel.init(bot);
  standupModel.init();
});

usersController.use(controller);
summaryController.use(controller);
standupController.use(controller);



// skip (current user)


// standup report
// notify next user
// conversation:
// * what did you do yesterday?
// * what are you doing today?
// * anything in your way?