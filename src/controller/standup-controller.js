var usersModel = require('../model/users-model')
  , standupModel = require('../model/standup-model')
  , standupHappening = false
  , standupChannel
  , userIterator
  , silentUsers = [];

module.exports.use = function(controller) {
  controller.hears('start', 'direct_mention', function(bot, message) {
    /*jshint maxcomplexity:6 */
    var eachUser;

    console.log(standupModel.getStatuses());
    if (standupModel.getStatuses().length > 0) {
      standupHappening = true;
    }

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

    // notify all users over DM
    userIterator = usersModel.iterator();
    while (userIterator.hasNext()) {
      eachUser = userIterator.next();
      silentUsers.push(eachUser.name);
      gatherStatus(bot, eachUser);
    }
  });

  controller.hears('end', 'direct_mention', function(bot, message) {
    if (!standupHappening) {
      return bot.reply(message, 'Standup is already over! Start another one with `start`');
    }

    if (silentUsers.length > 0) {
      bot.reply(message, 'The following users have not checked in, their input' +
                         'will be logged, but will not be in the report: ' + silentUsers.toString());
    }

    standupHappening = false;

    bot.reply(message, 'Standup is over!');
    summarizeStandup(bot);
    standupModel.clearStatuses();
    silentUsers = [];
  });

  controller.hears('report', 'direct_mention', function(bot, message) {
    if (!standupHappening) {
      bot.reply(message, 'There is no standup happening right now!');
      return;
    }

    standupModel.summarize(bot);
    if (silentUsers.length > 0) {
      bot.reply(message, 'The following users have not replied: ' + silentUsers.toString());
    }
  });

  /*******************
   * Running Standup *
   *******************/

  function gatherStatus(bot, eachUser) {
    bot.startPrivateConversation({
                                user: eachUser.id,
                                channel: eachUser.id
                              },
                               function(err, convo) {

      convo.say('Heya! Time for standup!');
      convo.ask('What have you done since the last standup?', convoCallback, {
        channel: eachUser.id,
        key: 'yesterday',
        multiple: true
      });

      convo.ask('What are you working on now?', convoCallback, {
        channel: eachUser.id,
        key: 'today',
        multiple: true
      });

      convo.ask('Anything in your way?', convoCallback, {
        channel: eachUser.id,
        key: 'obstacles',
        multiple: true
      });

      convo.say('Great! Thanks ' + eachUser.name + '!');

      convo.on('end', function(convo) {
        if (convo.status === 'completed') {
          standupModel.addStatus({
            yesterday: convo.extractResponse('yesterday'),
            today: convo.extractResponse('today'),
            obstacles: convo.extractResponse('obstacles'),
            user: eachUser
          });
        }

        return afterStatus(bot, eachUser);
      });

      function convoCallback(response, convo) {
        convo.next();
      }
    });
  }

  function afterStatus(bot, eachUser) {
    var errConfig = {channel: standupChannel, text: 'Error showing status for ' + eachUser.name}
    , idx = silentUsers.indexOf(eachUser.name);
    if (idx > -1) {
      silentUsers.splice(idx, 1);
    }
    return standupModel.summarizeUser(eachUser.name)
        .fail(function(err) {
          console.log(err);
          bot.say({text: 'error showing your status!', channel: eachUser.id});
          return bot.say(errConfig);
        });
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
