var q = require('q')
  , _ = require('lodash')
  , moment = require('moment')
  , statuses = []
  , summaryChannel
  , getChannel
  , saveChannel
  , model = module.exports;

model.init = function(controller) {
  getChannel = q.nbind(controller.storage.teams.get, controller.storage.teams);
  saveChannel = q.nbind(controller.storage.teams.save, controller.storage.teams);

  return getChannel('summarychannel')
    .then(function(sc) {
      if (sc) {
        summaryChannel = sc.channel;
      }
    });
};

model.setSummaryChannel = function(channel) {
  summaryChannel = channel;
  return saveChannel({id: 'summarychannel', channel: channel});
};

model.getSummaryChannel = function() {
  return summaryChannel;
};

model.addStatus = function(status) {
  statuses.push(status);
};

model.getStatuses = function() {
  return statuses;
};

model.clearStatuses = function() {
  statuses = [];
};

model.summarize = function(bot) {
  var upload = q.nbind(bot.api.files.upload, bot.api.files)
    , today = moment().format('YYYY-MM-DD')
    , title = 'Standup for ' + today
    , summaries = compileSummaries();


  return q.all(_.map(summaries, function(summary, index) {
    var postTitle = title;
    if (summaries.length > 1) {
      postTitle += ' (' + (index + 1) + ' of ' + summaries.length + ')';
    }

    return upload({
      filetype: 'post',
      filename: postTitle,
      title: postTitle,
      content: summary,
      channels: summaryChannel
    }).fail(function(err) {
      console.log(err);
      throw err;
    });
  })).finally(function() {
    model.clearStatuses();
  });
};

function compileSummaries() {
  var summaries = []
    , compiledSummary = '';

  _.each(statuses, function(status) {
    var summary = '##Status for ' + status.user.name + '##\n\n' +
        '_What did you do since the last standup?_\n\n' + markdownify(status.yesterday) + '\n\n' +
        '_What did are you doing today?_\n\n' + markdownify(status.today) + '\n\n' +
        '_Anything in your way?_\n\n' + markdownify(status.obstacles) + '\n\n' +
        '----\n\n'
    ;

    // slack recommends no more than 4K characters per post
    if ((compiledSummary.length + summary.length) > 4000) {
      summaries.push(compiledSummary);
      compiledSummary = summary;
    } else {
      compiledSummary += summary;
    }
  });

  summaries.push(compiledSummary);

  return summaries;
}

function markdownify(message) {
  return message.replace(/\n/g, '\n\n');
}
