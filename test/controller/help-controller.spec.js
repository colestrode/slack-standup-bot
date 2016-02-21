// jshint expr:true
var chai = require('chai')
  , expect = chai.expect
  , sinon = require('sinon');

chai.use(require('sinon-chai'));

describe('Help Controller', function() {
  var botController
    , helpController
    , botMock;

  beforeEach(function() {
    botMock = {
      identity: { name: 'robblerobble'},
      reply: sinon.stub()
    };

    botController = {
      hears: sinon.stub()
    };

    helpController = require('../../src/controller/help-controller');
  });

  it('should register a help listener', function() {
    helpController.use(botController);
    expect(botController.hears).to.have.been.called;
    expect(botController.hears.firstCall.args).to.have.length(3);
    expect(botController.hears.firstCall.args[2]).to.be.a.function;
  });

  it('should reply with help message', function() {
    var message = {};

    helpController.use(botController);
    botController.hears.firstCall.args[2](botMock, message);
    expect(botMock.reply).to.have.been.calledWithMatch(message);
  });
});
