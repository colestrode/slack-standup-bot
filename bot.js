var Botkit = require('botkit')
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
  require('./model/users-model').init(bot);
  require('./model/standup-model').init();
});

usersController.use(controller);
summaryController.use(controller);
standupController.use(controller);
