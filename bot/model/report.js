var reports = {};

module.exports.add = function(user, report) {
  reports[user] = report;
};