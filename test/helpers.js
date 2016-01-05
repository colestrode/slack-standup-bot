var helpers = module.exports
  , _ = require('lodash')
  , q = require('q');

helpers.createHearsMap = function(botController) {
  var callMap = {};

  _.each(botController.hears.args, function(call) {
    var message = call[0]
      , callback = call[2];

    if (_.isArray(message)) {
      message = message.join(' ');
    }

    callMap[message] = callback;
  });

  return callMap;
};

helpers.rejects = function(data) {
  return q.reject(data);
};

helpers.resolves = function(data) {
  var deferred = q.defer();
  deferred.resolve(data);
  return deferred.promise;
};
