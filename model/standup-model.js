var q = require('q')
  , _ = require('lodash')
  , moment = require('moment')
  , statuses = []
  , summaryChannel
  , getChannel
  , saveChannel;

module.exports.init = function(controller) {
  getChannel = q.nbind(controller.storage.teams.get, controller.storage.teams);
  saveChannel = q.nbind(controller.storage.teams.save, controller.storage.teams);

  getChannel('summarychannel')
    .then(function(sc) {
      if (sc) {
        summaryChannel = sc.channel;
      }
    });
};

module.exports.setSummaryChannel = function(channel) {
  summaryChannel = channel;
  saveChannel({id: 'summarychannel', channel: channel});
};

module.exports.getSummaryChannel = function() {
  return summaryChannel;
};

module.exports.addStatus = function(status) {
  statuses.push(status);
};

module.exports.getStatuses = function() {
  return statuses;
};

module.exports.summarize = function(bot) {
  var upload = q.nbind(bot.api.files.upload, bot.api.files)
    , today = moment().format('YYYY-MM-DD')
    , title = 'Standup for ' + today
    , summary = compileSummary();

  statuses = [];

  return upload({
    filetype: 'post',
    filename: title,
    title: title,
    content: summary,
    channels: summaryChannel
  }).fail(function(err) {
    console.log(err);
    throw err;
  });
};

function compileSummary() {
  var summary = '';

  _.each(statuses, function(status) {
    summary += '##Status for ' + status.user.name + '##\n\n' +
        '_What did you do since the last standup?_\n\n' + markdownify(status.yesterday) + '\n\n' +
        '_What did are you doing today?_\n\n' + markdownify(status.today) + '\n\n' +
        '_Anything in your way?_\n\n' + markdownify(status.obstacles) + '\n\n' +
        '----\n\n'
    ;
  });

  return summary;
}

function markdownify(message) {
  return message.replace(/\n/g, '\n\n');
}