// copied from https://github.com/howdyai/botkit version 0.0.5, original authors: RafaelCosman and guillaumepotier
// issues have been filed to pull redis support out of botkit and make a standalone module, so instead of depending
// on the presence of this file, I pulled it into this repo. The file is left as is except for minor changes to help it
// pass this repos linting rules

var redis = require('redis'); // https://github.com/NodeRedis/node_redis

/*
 * All optional
 *
 * config = {
 *  namespace: namespace,
 *  host: host,
 *  port: port
 * }
 * // see https://github.com/NodeRedis/node_redis#options-is-an-object-with-the-following-possible-properties for a full list of the valid options
 */
module.exports = function(config) {
  config = config || {};
  config.namespace = config.namespace || 'botkit:store';

  var storage = {},
    client = redis.createClient(config), // could pass specific redis config here
    methods = config.methods || ['teams', 'users', 'channels'];

  // Implements required API methods
  for (var i = 0; i < methods.length; i++) {
    storage[methods[i]] = getStorageObj(methods[i], client, config);
  }

  return storage;
};

function getStorageObj(hash, client, config) {
  return {
    get: function(id,cb) {
      client.hget(config.namespace + ':' + hash, id, function(err, res) {
        cb(err, JSON.parse(res));
      });
    },
    save: function(object,cb) {
      if (!object.id) {// Silently catch this error?
        return cb(new Error('The given object must have an id property'), {});
      }

      client.hset(config.namespace + ':' + hash, object.id, JSON.stringify(object), cb);
    },
    all: function(cb, options) {
      client.hgetall(config.namespace + ':' + hash, function(err, res) {
        if (err) {
          return cb(err, {});
        }

        if (res === null) {
          return cb(err, res);
        }

        var parsed
          , array = [];

        for (var i in res) {
          parsed = JSON.parse(res[i]);
          res[i] = parsed;
          array.push(parsed);
        }

        cb(err, options && options.type === 'object' ? res : array);
      });
    },
    allById: function(cb) {
      this.all(cb, {type: 'object'});
    }
  };
}
