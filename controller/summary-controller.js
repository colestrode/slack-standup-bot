var standupModel = require('../model/standup-model');

module.exports.use = function(controller) {
  controller.hears(['summarize in (.*)', 'summarize to (.*)', 'report in (.*)', 'report to (.*)'], 'direct_mention', function(bot, message) {
    var channelId = message.match[1]
      , matches = channelId.match(/<#(.*)>/);

    if (!matches || matches.length < 2) {
      standupModel.summaryChannel = message.channel;
      bot.reply(message, 'I\'m not sure where channel that is, so I\'m going to use this one until you tell me different, cool?');
    } else {
      standupModel.summaryChannel = matches[1];
      bot.reply(message, 'Aye aye captain! :ok_hand:');
    }
  });
};