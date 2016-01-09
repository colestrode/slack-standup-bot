// jshint expr:true
var chai = require('chai')
  , expect = chai.expect
  , sinon = require('sinon')
  , proxyquire = require('proxyquire')
  , _ = require('lodash')
  , helpers = require('../helpers');

chai.use(require('sinon-chai'));

describe('Standup Model', function() {
  var botMock
    , botController
    , channel
    , StandupModel;

  beforeEach(function() {
    channel = 'amc';

    botMock = {
      api: {
        files: {
          upload: sinon.stub().yields(null, {})
        }
      }
    };

    botController = {
      storage: {
        teams: {
          get: sinon.stub().yields(null, {channel: channel}),
          save: sinon.stub().yields(null)
        }
      }
    };

    delete require.cache[path.resolve('./model/standup-model.js')];
    StandupModel = require('../../model/standup-model');
  });

  describe('init', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });

  describe('setSummaryChannel', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });

  describe('getSummaryChannel', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });

  describe('addStatus', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });

  describe('getStatuses', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });

  describe('clearStatuses', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });

  describe('summarize', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });
});
