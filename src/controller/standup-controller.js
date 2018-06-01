var usersModel = require('../model/users-model')
  , standupModel = require('../model/standup-model')
  , standupHappening = false
  , standupChannel
  , userIterator;

module.exports.use = function(controller) {
  controller.hears('start', 'direct_mention', function(bot, message) {
    /*jshint maxcomplexity:6 */
    var eachUser;

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
      gatherStatus(bot, eachUser);
    }
  });

  controller.hears('remind', ['direct_mention', 'direct_message'], function(bot, message) {
    var eachUser
    , userIterator = usersModel.iterator(),
    remindedUsers = [];

    if (!standupHappening) {
      bot.reply(message, 'there\'s no standup to remind people about!');
      return;
    }

    if (standupModel.getResponsiveUsers().length === usersModel.list().length) {
      bot.reply(message, 'everyone seems to have responded!');
      return;
    }

    while (userIterator.hasNext()) {
      eachUser = userIterator.next();
      // doing this rather than parsing silentUsers because it needs the
      // user object and that function is designed to return names
      if (!standupModel.isResponsiveUser(eachUser)) {
        remindStatus(bot, eachUser);
        remindedUsers.push(eachUser.name);
      }
    }
    bot.reply(message, 'I just reminded these users: ' + remindedUsers);
  });

  controller.hears('end', 'direct_mention', function(bot, message) {
    var silentUsers = getSilentUsers();

    if (!standupHappening) {
      return bot.reply(message, 'Standup is already over! Start another one with `start`');
    }

    if (silentUsers.length > 0) {
      bot.reply(message, 'The following users have not checked in, their input ' +
                         'will be logged, but will not be in the report: ' + silentUsers);
    }

    standupHappening = false;

    bot.reply(message, 'Standup is over!');
    summarizeStandup(bot);
    standupModel.clearStatuses();
  });

  controller.hears('report', 'direct_mention', function(bot, message) {
    var silentUsers = getSilentUsers();

    if (!standupHappening) {
      bot.reply(message, 'There is no standup happening right now!');
      return;
    }

    standupModel.summarize(bot);
    if (silentUsers.length > 0) {
      bot.reply(message, 'The following users have not replied: ' + silentUsers);
    }
  });

  /*******************
   * Running Standup *
   *******************/
  function remindStatus(bot, eachUser) {
    bot.startPrivateConversation({
                                user: eachUser.id,
                                channel: eachUser.id
                              },
                                function(err, convo) {
      convo.say('Please check in by answering the previous question!');
    });
  }

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
    var errConfig = {channel: standupChannel, text: 'Error showing status for ' + eachUser.name};
    standupModel.addResponsiveUser(eachUser);
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

  function getSilentUsers() {
    var silentUsers = []
      , eachUser
      , userIterator;
    userIterator = usersModel.iterator();
    while (userIterator.hasNext()) {
      eachUser = userIterator.next();
      if (!standupModel.isResponsiveUser(eachUser)) {
        silentUsers.push(eachUser.name);
      }
    }
    return silentUsers;
  }
};
