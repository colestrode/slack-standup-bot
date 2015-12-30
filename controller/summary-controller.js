var summaryChannel; // TODO this might move to a model, it should be persisted


module.exports.use = function(controller) {
  controller.hears(['summarize to (.*)', 'report to (.*)'], 'direct_mention', function(bot, message) {
    var channelId = message.match[1]
      , matches = channelId.match(/<#(.*)>/);

    if (!matches || matches.length < 2) {
      summaryChannel = message.channel;
      bot.reply(message, 'I\'m not sure where channel that is, so I\'m going to use this one until you tell me different, cool?');
    } else {
      summaryChannel = matches[1];
      bot.reply(message, 'Aye aye captain! :ok_hand:');
    }
  });

  // this is just a stub for now, eventually we'll get all the standup statuses and compile them
  controller.hears('summarize', 'direct_mention', function(bot, message) {
    var lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum';
    var now = new Date();
    var today = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();

    var opts = {
      filetype: 'post',
      filename: 'Standup for ' + today,
      title: 'test file ' + now.getTime(),
      content: lorem,
      initial_comment: ':boom:',
      channels: summaryChannel || message.channel
    };

    bot.api.files.upload(opts, function(err) {
      if (err) {
        bot.reply(message, 'Oops! check the logs!');
        console.log(err);
        return;
      }

      bot.reply(message, 'Post successfully created!');
    })
  });
};