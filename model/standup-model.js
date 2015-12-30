var q = require('q')
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

  var lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum';

  return upload({
    filetype: 'post',
    filename: 'Standup for ' + today,
    title: 'test file ' + now.getTime(),
    content: lorem,
    initial_comment: ':boom:',
    channels: module.exports.summaryChannel
  }).fail(function(err) {
    console.log(err);
    throw err;
  });
};