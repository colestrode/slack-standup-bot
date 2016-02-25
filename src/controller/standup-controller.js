var usersModel = require('../model/users-model')
  , standupModel = require('../model/standup-model')
  , q = require('q')
  , readyForNextStatus = false
  , standupHappening = false
  , standupChannel
  , currentUser
  , userIterator;

module.exports.use = function(controller) {
  controller.hears('start', 'direct_mention', function(bot, message) {

    if (standupHappening) {
      return bot.reply(message, 'Standup has already started!');
    }

    if (!standupModel.getSummaryChannel()) {
      standupModel.setSummaryChannel(message.channel);
    }

    standupChannel = message.channel; // save this for later

    if (usersModel.list().length === 0) {
      return bot.reply(message, 'Looks like no one is in the team! Get a few people to join and then we\'ll have some fun!');
    }

    standupHappening = true;
    bot.reply(message, 'Alright! Let\'s get this party started!');

    // notify first user and start a conversation
    userIterator = usersModel.iterator();
    currentUser = userIterator.next();
    promptUser(bot);
  });

  controller.hears('end', 'direct_mention', function(bot, message) {
    if (!standupHappening) {
      return bot.reply(message, 'Standup is already over! Start another one with `start`');
    }

    readyForNextStatus = false;
    standupHappening = false;

    bot.reply(message, 'Standup is over!');

    bot.startConversation(message, function(err, convo) {
      convo.ask('<@' + message.user + '> do you want a summary of this standup?', [{
          pattern: bot.utterances.yes,
          callback: function(response, convo) {
            return summarizeStandup(bot)
              .finally(function() {
                convo.next();
              });
          }
        }, {
          pattern: bot.utterances.no,
          callback: function(response, convo) {
            bot.say({channel: message.channel, text: 'Ok :hear_no_evil: Come again soon!'});
            standupModel.clearStatuses();
            convo.next();
          }
        }]);
    });
  });


  /*******************
   * Running Standup *
   *******************/

  controller.hears(['yes', 'yea', 'yup', 'yep', 'ya', 'sure', 'ok', 'yeah', 'yah', 'ready', 'sup'], 'direct_mention,ambient', function(bot, message) {
    if (readyForNextStatus && message.user === currentUser.id) {
      readyForNextStatus = false;
      gatherStatus(bot, message);
    }
  });

  controller.hears(['skip', 'no', 'nope', 'nah'], 'direct_mention,ambient', function(bot, message) {
    if (readyForNextStatus) {
      bot.reply(message, 'Skipping ' + currentUser.name);
      return afterStatus(bot);
    }
    return q(); // for testing
  });

  function promptUser(bot) {
    readyForNextStatus = true;
    bot.say({
      text: '<@' + currentUser.id + '> are you ready?',
      channel: standupChannel
    });
  }

  function gatherStatus(bot, message) {
    bot.startConversation(message, function(err, convo) {

      convo.ask('What have you done since the last standup?', convoCallback, {
        key: 'yesterday',
        multiple: true
      });

      convo.ask('What are you working on now?', convoCallback, {
        key: 'today',
        multiple: true
      });

      convo.ask('Anything in your way?', convoCallback, {
        key: 'obstacles',
        multiple: true
      });

      convo.say('Great! Thanks ' + currentUser.name + '!');

      convo.on('end', function(convo) {
        if (convo.status === 'completed') {
          standupModel.addStatus({
            yesterday: convo.extractResponse('yesterday'),
            today: convo.extractResponse('today'),
            obstacles: convo.extractResponse('obstacles'),
            user: currentUser
          });
        }

        return afterStatus(bot);
      });

      function convoCallback(response, convo) {
        convo.next();
      }
    });
  }

  function afterStatus(bot) {
    // get next user, if null summarize
    if (userIterator.hasNext()) {
      currentUser = userIterator.next();
      promptUser(bot);
      return q();
    } else {
      standupHappening = false;
      readyForNextStatus = false;
      return summarizeStandup(bot);
    }
  }

  function summarizeStandup(bot) {
    var sayConfig = {channel: standupChannel, text: 'Great job everyone! :tada:'};

    return standupModel.summarize()
      .then(function() {
        sayConfig.text += ' You can find a summary in <#' + standupModel.getSummaryChannel() + '>';
        bot.say(sayConfig);
      })
      .fail(function(err) {
        console.log(err);
        sayConfig.text += ' I had a problem saving the summary though, sorry about that :grimacing:';
        return bot.say(sayConfig);
      });
  }
};
