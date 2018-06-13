var Botkit = require('botkit')
  , config = require('config')
  , usersController = require('./controller/users-controller')
  , summaryController = require('./controller/summary-controller')
  , standupController = require('./controller/standup-controller')
  , helpController = require('./controller/help-controller')
  , controller;

// linter doesn't like that botkit isn't using camel case, sigh
controller = Botkit.slackbot({
  retry: 10,
  debug: false,
  json_file_store: config.JSON_FILE_STORE_PATH // jshint ignore:line
});

// connect the bot to a stream of messages
controller.spawn({
  token: config.SLACK_API_TOKEN,
  retry: 500
}).startRTM(function(err, bot) {
  // don't load the controllers until the models are done loading so they can init properly
  require('./model/users-model').init(controller, bot)
    .then(function() {
      usersController.use(controller);
    });

  require('./model/standup-model').init(controller, bot)
    .then(function() {
      summaryController.use(controller);
      standupController.use(controller);
    });

  helpController.use(controller);
});

// Something keeps magically closing the connections between the bot and slack,
// this causes forever to kick the process when that happens.
// It can also potentially cause logspam on shutdown, but it's worth it
controller.on('rtm_close', function() {
  console.log('Oh coconuts! The connection died, hope it reconnects!');
});
