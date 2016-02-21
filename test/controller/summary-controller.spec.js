// jshint expr:true
var chai = require('chai')
  , expect = chai.expect
  , sinon = require('sinon')
  , proxyquire = require('proxyquire').noCallThru()
  , _ = require('lodash')
  , helpers = require('../helpers');

chai.use(require('sinon-chai'));

describe('Summary Controller', function() {
  var botMock
    , botController
    , standupModelMock
    , summaryController;

  beforeEach(function() {
    botMock = {
      identity: { name: 'robblerobble'},
      reply: sinon.stub()
    };

    botController = {
      hears: sinon.stub()
    };

    standupModelMock = {
      setSummaryChannel: sinon.stub(),
      getSummaryChannel: sinon.stub()
    };

    summaryController = proxyquire('../../src/controller/summary-controller', {
      '../model/standup-model': standupModelMock
    });
  });

  it('should set up a summarize listener', function() {
    summaryController.use(botController);
    expect(botController.hears).to.have.been.called;
    expect(botController.hears.firstCall.args).to.have.length(3);
    expect(botController.hears.firstCall.args[2]).to.be.a.function;
  });

  describe('hears', function() {
    var hearsMap;

    beforeEach(function() {
      summaryController.use(botController);
      hearsMap = helpers.createHearsMap(botController);
    });

    describe('summarize to', function() {
      var summarizeCallback
        , message;

      beforeEach(function() {
        summaryController.use(botController);
        summarizeCallback = _.find(hearsMap, function(val, key) {
          return key.indexOf('(report|summarize)') === 0;
        });
        message = {channel: 'robblerobble', match: ['', '', '', 'heisenberg']};
      });

      it('should use message channel if channel is in wrong format', function() {
        summarizeCallback(botMock, message);
        expect(botMock.reply).to.have.been.calledWithMatch(message);
        expect(standupModelMock.setSummaryChannel).to.have.been.calledWith(message.channel);
      });

      it('should use match if channel is in right format', function() {
        message.match[3] = '<#heisenberg>';
        summarizeCallback(botMock, message);
        expect(botMock.reply).to.have.been.calledWithMatch(message);
        expect(standupModelMock.setSummaryChannel).to.have.been.calledWith('heisenberg');
      });

    });

    describe('where do you summarize', function() {
      var callback;

      beforeEach(function() {
        callback = _.find(hearsMap, function(val, key) {
          return key.indexOf('where do you') === 0;
        });
      });

      it('should reply if found', function() {
        standupModelMock.getSummaryChannel.returns('crystalbluepersuasion');
        callback(botMock, {});

        expect(botMock.reply).to.have.been.called;
        expect(botMock.reply.firstCall.args[1]).to.match(new RegExp('<#crystalbluepersuasion>'));
      });

      it('should reply if channel not found', function() {
        standupModelMock.getSummaryChannel.returns(undefined);
        callback(botMock, {});

        expect(botMock.reply).to.have.been.called;
        expect(botMock.reply.firstCall.args[1]).to.match(new RegExp('Nobody set a summary channel'));
      });
    });
  });
});
