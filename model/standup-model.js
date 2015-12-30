var q = require('q')
  , _ = require('lodash')
  , statuses = {};

module.exports.summaryChannel; // TODO this should be persisted
module.exports.happening = false;

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
    , now = new Date()
    , today = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();

  return upload({
    filetype: 'post',
    filename: 'Standup for ' + today,
    title: 'test file ' + now.getTime(),
    content: compileSummary(),
    initial_comment: ':boom:',
    channels: module.exports.summaryChannel
  }).fail(function(err) {
    console.log(err);
    throw err;
  });
};

function compileSummary() {
  var summary = '';

  _.forOwn(statuses, function(status, userId) {
    summary = '*Summary for ' + userId + '*\n\n' +
        '*What did you do yesterday?*\n' + status.yesterday + '\n\n' +
        '*What did are you doing today?*\n' + status.today + '\n\n' +
        '*Anything in your way?*\n' + status.obstacles + '\n\n';
  });

  return summary;
}