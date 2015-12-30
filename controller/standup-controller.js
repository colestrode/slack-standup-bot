var usersModel = require('../model/users-model')
  , standupModel = require('../model/standup-model');

module.exports.use = function(controller) {
  controller.hears('start', 'direct_mention', function(bot, message) {
    if (standupModel.happening) {
      return bot.reply(message, 'Standup has already started');
    }

    if (!standupModel.summaryChannel) {
      standupModel.summaryChannel = message.channel;
    }

    standupModel.happening = true;
    bot.reply(message, 'Alright! Let\'s get this party started!');

    // notify first user and start a conversation
  });

  controller.hears('end', 'direct_mention', function(bot, message) {
    if (!standupModel.happening) {
      return bot.reply(message, 'Standup has already started!');
    }

    bot.api.channels.info({channel: standupModel.summaryChannel}, function(err, res) {
      var reply = 'Great job everyone! :tada:';

      standupModel.happening = false;

      if (err) {
        return bot.reply(message, reply);
      }

      standupModel.summarize(bot)
        .then(function() {
          bot.reply(message, reply + ' You can find a summary in #' + res.channel.name);
        })
        .fail(function(err) {
          console.log(err);
          bot.reply(message, reply + ' I had a problem saving the summary though :grimacing:');
        });
    });
  });
};