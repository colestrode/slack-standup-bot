var Botkit = require('botkit')
  , usersController = require('./controller/users-controller')
  , summaryController = require('./controller/summary-controller')
  , standupController = require('./controller/standup-controller')
  , helpController = require('./controller/help-controller')
  , controller;

// linter doesn't like that botkit isn't using camel case, sigh
controller = Botkit.slackbot({
  debug: false,
  json_file_store: process.env.JSON_FILE_STORE_PATH // jshint ignore:line
});

// connect the bot to a stream of messages
controller.spawn({
  token: process.env.SLACK_API_TOKEN,
  retry: 500
}).startRTM(function(err, bot) {
  require('./model/users-model').init(controller, bot);
  require('./model/standup-model').init(controller, bot);
});

controller.on('rtm_close', function() {
  console.log('Oh coconuts! The connection died');
  process.exit(1);
});

usersController.use(controller);
summaryController.use(controller);
standupController.use(controller);
helpController.use(controller);
