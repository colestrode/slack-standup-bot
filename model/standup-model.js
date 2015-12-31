var q = require('q')
  , _ = require('lodash')
  , moment = require('moment')
  , statuses = {};

module.exports.summaryChannel; // TODO this should be persisted

module.exports.init = function() {
  // noop for now, but eventually we'll read from redis and set the summary channel
};

module.exports.addStatus = function(userId, status) {
  statuses[userId] = status;
};

module.exports.getStatuses = function() {
  return statuses;
};

module.exports.clearStatuses = function() {
  statuses = {};
};

module.exports.summarize = function(bot) {
  var upload = q.nbind(bot.api.files.upload, bot.api.files)
    , today = moment().format('YYYY-MM-DD')
    , title = 'Standup for ' + today;

  return upload({
    filetype: 'post',
    filename: title,
    title: title,
    content: compileSummary(),
    channels: module.exports.summaryChannel
  }).fail(function(err) {
    console.log(err);
    throw err;
  });
};

function compileSummary() {
  var summary = '';

  _.forOwn(statuses, function(status) {
    summary += '##Status for ' + status.user.name + '##\n\n' +
        '*_What did you do yesterday?_*\n\n' + status.yesterday + '\n\n' +
        '*_What did are you doing today?_*\n\n' + status.today + '\n\n' +
        '*_Anything in your way?_*\n\n' + status.obstacles + '\n\n' +
        '----\n\n'
    ;
  });

  return summary;
}