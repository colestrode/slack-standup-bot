var standupModel = require('../model/standup-model');

module.exports.use = function(controller) {
  controller.hears(['(report|summarize) (in|to) (.*)'], 'direct_mention', function(bot, message) {
    var matches = message.match[3].match(/<#(.*)>/)
      , channel;

    if (!matches) {
      channel = message.channel;
      bot.reply(message, 'I\'m not sure where channel that is, so I\'m going to use this one until you tell me different, cool?');
    } else {
      channel = matches[1];
      bot.reply(message, 'Aye aye captain! :ok_hand:');
    }

    standupModel.setSummaryChannel(channel);
  });

  controller.hears(['where do you (summarize|report)\s*(in|to)?'], 'direct_mention', function(bot, message) {
    var channel = standupModel.getSummaryChannel();

    if (channel) {
      bot.reply(message, 'I\'ll put the summaries in <#' + channel + '>');
    } else {
      bot.reply(message, 'Nobody set a summary channel yet! ' +
        'I\'ll just use the channel the standup started in or you can tell me with `@' + bot.identity.name + ' report to #channel`');
    }
  });
};
