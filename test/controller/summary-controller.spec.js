var chai = require('chai')
  , expect = chai.expect
  , sinon = require('sinon')
  , proxyquire = require('proxyquire');

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
      setSummaryChannel: sinon.stub()
    };

    summaryController = proxyquire('../../controller/summary-controller', {
      '../model/standup-model': standupModelMock
    });
  });

  it('should set up a summarize listener', function() {
    summaryController.use(botController);
    expect(botController.hears).to.have.been.called;
    expect(botController.hears.firstCall.args).to.have.length(3);
    expect(botController.hears.firstCall.args[2]).to.be.a.function;
  });

  describe('summarize', function() {
    var summarizeCallback
      , message;

    beforeEach(function() {
      summaryController.use(botController);
      summarizeCallback = botController.hears.firstCall.args[2];
      message = {channel: 'robblerobble', match: ['walterwhite', 'heisenber']};
    });

    it('should use message channel if channel is in wrong format', function() {
      summarizeCallback(botMock, message);
      expect(botMock.reply).to.have.been.calledWithMatch(message);
      expect(standupModelMock.setSummaryChannel).to.have.been.calledWith(message.channel);
    });

    it('should use match if channel is in right format', function() {
      message.match = ['walterwhite', '<#heisenberg>'];
      summarizeCallback(botMock, message);
      expect(botMock.reply).to.have.been.calledWithMatch(message);
      expect(standupModelMock.setSummaryChannel).to.have.been.calledWith('heisenberg');
    });

  });
});
