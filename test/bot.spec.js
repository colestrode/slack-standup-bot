// jshint expr:true
var chai = require('chai')
  , expect = chai.expect
  , sinon = require('sinon')
  , proxyquire = require('proxyquire').noCallThru();

chai.use(require('sinon-chai'));

describe('Bot', function() {
  var botkitMock
    , config
    , usersControllerMock
    , summaryControllerMock
    , standupControllerMock
    , helpControllerMock
    , usersModelMock
    , standupModelMock
    , controllerMock
    , Bot;

  beforeEach(function() {
    controllerMock = {
      on: sinon.stub(),
      spawn: sinon.stub(),
      startRTM: sinon.stub()
    };
    controllerMock.spawn.returns(controllerMock);

    botkitMock = {
      slackbot: sinon.stub().returns(controllerMock)
    };

    usersControllerMock = {use: sinon.stub()};
    summaryControllerMock = {use: sinon.stub()};
    standupControllerMock = {use: sinon.stub()};
    helpControllerMock = {use: sinon.stub()};

    usersModelMock = {init: sinon.stub()};
    standupModelMock = {init: sinon.stub()};

    config = {
      'SLACK_API_TOKEN': 'SLACK_API_TOKEN',
      'JSON_FILE_STORE_PATH': 'test'
    };

    Bot = proxyquire('../src/index', {
      'botkit': botkitMock,
      'config': config,
      './controller/users-controller': usersControllerMock,
      './controller/summary-controller': summaryControllerMock,
      './controller/standup-controller': standupControllerMock,
      './controller/help-controller': helpControllerMock,
      './model/users-model': usersModelMock,
      './model/standup-model': standupModelMock
    });
  });

  it('should create the controller', function() {
    expect(botkitMock.slackbot).to.have.been.calledWithMatch({json_file_store: config.JSON_FILE_STORE_PATH}); // jshint ignore:line
  });

  it('should startRTM', function() {
    var fakeBot = {};
    controllerMock.startRTM.yield(null, fakeBot);
    expect(controllerMock.spawn).to.have.been.calledWith({token: config.SLACK_API_TOKEN, retry: 500});
    expect(controllerMock.startRTM).to.have.been.called;

    expect(usersModelMock.init).to.have.been.calledWith(controllerMock, fakeBot);
    expect(standupModelMock.init).to.have.been.calledWith(controllerMock, fakeBot);
  });

  it('should initialize controllers', function() {
    expect(usersControllerMock.use).to.have.been.calledWith(controllerMock);
    expect(summaryControllerMock.use).to.have.been.calledWith(controllerMock);
    expect(standupControllerMock.use).to.have.been.calledWith(controllerMock);
    expect(helpControllerMock.use).to.have.been.calledWith(controllerMock);
  });

});
