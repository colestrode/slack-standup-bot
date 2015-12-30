var usersModel = require('../model/users-model')
  , standupModel = require('../model/standup-model')
  , _ = require('lodash')
  , readyForNextStatus = false
  , standupChannel
  , currentUser;

module.exports.use = function(controller) {
  controller.hears('start', 'direct_mention', function (bot, message) {

    if (standupModel.happening) {
      return bot.reply(message, 'Standup has already started!');
    }

    if (!standupModel.summaryChannel) {
      standupModel.summaryChannel = message.channel;
    }

    standupChannel = message.channel; // save this for later

    if (usersModel.list().length === 0) {
      return bot.reply(message, 'Looks like no one is in the team! Get a few people to join and then we\'ll have some fun!');
    }

    standupModel.happening = true;
    bot.reply(message, 'Alright! Let\'s get this party started!');
    readyForNextStatus = true;

    // notify first user and start a conversation
    startStatus(bot, message);
  });

  controller.hears('end', 'direct_mention', function (bot, message) {
    if (!standupModel.happening) {
      return bot.reply(message, 'Standup is already over! Start another one with `start`');
    }

    bot.api.channels.info({channel: standupModel.summaryChannel}, function (err, res) {
      var reply = 'Great job everyone! :tada:';

      standupModel.happening = false;

      if (err) {
        return bot.reply(message, reply);
      }

      standupModel.summarize(bot)
        .then(function () {
          bot.reply(message, reply + ' You can find a summary in #' + res.channel.name);
        })
        .fail(function (err) {
          console.log(err);
          bot.reply(message, reply + ' I had a problem saving the summary though, sorry about that :grimacing:');
        });
    });
  });

  controller.hears(['yes', 'yea', 'yup', 'yep', 'ya', 'sure', 'ok', 'y', 'yeah', 'yah'], 'direct_mention,ambient', function (bot, message) {
    if (readyForNextStatus && message.user === currentUser.id) {
      readyForNextStatus = false;
      gatherStatus(bot, message, _.bind(standupModel.summarize, standupModel, bot));
    }
  });

  controller.hears(['skip'], 'direct_mention, ambient', function (bot, message) {
    if (readyForNextStatus) {
      bot.reploy(message, 'Skipping (but not really)');
    }
  });


  function startStatus(bot) {
    var users = usersModel.list();
    currentUser = users[0];
    bot.say({
      text: '<@' + currentUser.id + '> are you ready?',
      channel: standupChannel
    });
  }

  function gatherStatus(bot, message, done) {
    bot.startConversation(message, function (err, convo) {
      console.log('conversation started');
      convo.ask('What did you do yesterday?', function(response, convo) {
        convo.next();
      }, {
        key: 'yesterday',
        multiple: true
      });

      convo.ask('What are you doing today?', function(response, convo) {
        convo.next();
      }, {
        key: 'today',
        multiple: true
      });

      convo.ask('Anything in your way?', function(response, convo) {
        convo.next();
      }, {
        key: 'obstacles',
        multiple: true
      });

      convo.on('end', function(convo) {
        if (convo.status === 'completed') {
          standupModel.addStatus(currentUser.id, {
            yesterday: convo.extractResponse('yesterday'),
            today: convo.extractResponse('today'),
            obstacles: convo.extractResponse('obstacles')
          });

          done();
        }
      });
    });
  }
};