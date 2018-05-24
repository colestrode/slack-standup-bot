var q = require('q')
  , _ = require('lodash')
  , moment = require('moment')
  , statuses = []
  , summaryChannel
  , teamsGet
  , teamsSave
  , filesUpload
  , model = module.exports;

model.init = function(controller, bot) {
  teamsGet = q.nbind(controller.storage.teams.get, controller.storage.teams);
  teamsSave = q.nbind(controller.storage.teams.save, controller.storage.teams);
  filesUpload = q.nbind(bot.api.files.upload, bot.api.files);

  loadStatuses();
  return teamsGet('summarychannel')
    .then(function(sc) {
      if (sc) {
        summaryChannel = sc.channel;
      }
      return summaryChannel;
    });
};

model.setSummaryChannel = function(channel) {
  summaryChannel = channel;
  return teamsSave({id: 'summarychannel', channel: channel});
};

model.getSummaryChannel = function() {
  return summaryChannel;
};

model.addStatus = function(status) {
  statuses.push(status);
  return teamsSave({id: 'statuses', statuses: statuses});
};

model.getStatuses = function() {
  return statuses;
};

model.clearStatuses = function() {
  statuses = [];
  return teamsSave({id: 'statuses', statuses: []});
};

model.summarize = function() {
  var today = moment().format('YYYY-MM-DD')
    , title = 'Standup for ' + today
    , summaries = compileSummaries();

  return q.all(_.map(summaries, function(summary, index) {
    var postTitle = title;
    if (summaries.length > 1) {
      postTitle += ' (' + (index + 1) + ' of ' + summaries.length + ')';
    }

    return filesUpload({
      filetype: 'post',
      filename: postTitle,
      title: postTitle,
      content: summary,
      channels: summaryChannel
    }).fail(function(err) {
      console.log(err);
      throw err;
    });
  }));
};

model.summarizeUser = function(username) {
  var summary = ''
  , postTitle = 'Summary for ' + username + '\n\n';
  _.each(statuses, function(status) {
    if (status.user.name === username) {
      summary = '##Status for ' + status.user.name + '##\n\n' +
        '_What did you do since the last standup?_\n\n' + markdownify(status.yesterday) + '\n\n' +
        '_What are you working on now?_\n\n' + markdownify(status.today) + '\n\n' +
        '_Anything in your way?_\n\n' + markdownify(status.obstacles) + '\n\n' +
        '----\n\n';
    }
  });
  // TODO test that summary got populated
  return filesUpload({
    filetype: 'post',
    filename: postTitle,
    title: postTitle,
    content: summary,
    channels: summaryChannel
  }).fail(function(err) {
    console.log(err);
    throw err;
  });
};

function compileSummaries() {
  var summaries = []
    , compiledSummary = '';

  _.each(statuses, function(status) {
    var summary = '##Status for ' + status.user.name + '##\n\n' +
        '_What did you do since the last standup?_\n\n' + markdownify(status.yesterday) + '\n\n' +
        '_What are you working on now?_\n\n' + markdownify(status.today) + '\n\n' +
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

function loadStatuses() {
  return teamsGet('statuses')
    .then(function(statusesRecord) {
      // TBH this is purely to simplify the tests which are defaulting to return
      // the summary channel from teamsGet
      if (statusesRecord && statusesRecord.statuses) {
        statuses = statusesRecord.statuses;
      }
      return statuses;
    });
}

