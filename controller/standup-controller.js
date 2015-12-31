var usersModel = require('../model/users-model')
  , standupModel = require('../model/standup-model')
  , readyForNextStatus = false
  , standupHappening = false
  , standupChannel
  , currentUser
  , userIterator;

module.exports.use = function(controller) {
  controller.hears('start', 'direct_mention', function (bot, message) {

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

  controller.hears('end', 'direct_mention', function (bot, message) {
    if (!standupHappening) {
      return bot.reply(message, 'Standup is already over! Start another one with `start`');
    }

    readyForNextStatus = false;
    standupHappening = false;

    bot.reply(message, 'Standup is over!');

    bot.startConversation(message, function (err, convo) {
      convo.ask('<@' + message.user + '> do you want a summary of this standup?', [{
          pattern: bot.utterances.yes,
          callback: function(response, convo) {
            summarizeStandup(bot);
            convo.next();
          }
        }, {
          pattern: bot.utterances.no,
          callback: function(response, convo) {
            bot.say({channel: message.channel, text: 'Ok :hear_no_evil: Come again soon!'});
            convo.next();
          }
        }]);
    });
  });


  /*******************
   * Running Standup *
   *******************/

  controller.hears(['yes', 'yea', 'yup', 'yep', 'ya', 'sure', 'ok', 'y', 'yeah', 'yah'], 'direct_mention,ambient', function (bot, message) {
    if (readyForNextStatus && message.user === currentUser.id) {
      readyForNextStatus = false;
      gatherStatus(bot, message);
    }
  });

  controller.hears(['skip', 'no', 'nope', 'nah', 'n'], 'direct_mention,ambient', function (bot, message) {
    if (readyForNextStatus) {
      bot.reply(message, 'Skipping ' + currentUser.name);
      afterStatus(bot);
    }
  });

  function promptUser(bot) {
    readyForNextStatus = true;
    bot.say({
      text: '<@' + currentUser.id + '> are you ready?',
      channel: standupChannel
    });
  }

  function gatherStatus(bot, message) {
    bot.startConversation(message, function (err, convo) {

      convo.ask('What did you do yesterday?', convoCallback, {
        key: 'yesterday',
        multiple: true
      });

      convo.ask('What are you doing today?', convoCallback, {
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
          standupModel.addStatus(currentUser.id, {
            yesterday: convo.extractResponse('yesterday'),
            today: convo.extractResponse('today'),
            obstacles: convo.extractResponse('obstacles'),
            user: currentUser
          });
        }

        afterStatus(bot);
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
    } else {
      summarizeStandup(bot);
      standupHappening = false;
      readyForNextStatus = false;
    }
  }

  function summarizeStandup(bot) {
    var sayConfig = {channel: standupChannel, text: 'Great job everyone! :tada:'};

    standupModel.summarize(bot)
      .then(function () {
        sayConfig.text += ' You can find a summary in <#' + standupModel.getSummaryChannel() + '>';
        bot.say(sayConfig);
      })
      .fail(function (err) {
        console.log(err);
        sayConfig.text += ' I had a problem saving the summary though, sorry about that :grimacing:';
        return bot.say(sayConfig);
      });
  }
};