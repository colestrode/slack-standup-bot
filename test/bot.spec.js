// jshint expr:true
var chai = require('chai')
  , expect = chai.expect
  , sinon = require('sinon')
  , proxyquire = require('proxyquire').noCallThru();

chai.use(require('sinon-chai'));

describe('Bot', function() {
  var botkitMock
    , usersControllerMock
    , summaryControllerMock
    , standupControllerMock
    , helpControllerMock
    , usersModelMock
    , standupModelMock
    , redisStorageMock
    , storageObjMock
    , controllerMock
    , Bot;

  beforeEach(function() {
    controllerMock = {
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

    storageObjMock = {};
    redisStorageMock = sinon.stub().returns(storageObjMock);

    process.env.REDIS_URL = 'REDIS_URL';
    process.env.SLACK_API_TOKEN = 'SLACK_API_TOKEN';

    Bot = proxyquire('../src/index', {
      'botkit': botkitMock,
      './controller/users-controller': usersControllerMock,
      './controller/summary-controller': summaryControllerMock,
      './controller/standup-controller': standupControllerMock,
      './controller/help-controller': helpControllerMock,
      'botkit-storage-redis': redisStorageMock,
      './model/users-model': usersModelMock,
      './model/standup-model': standupModelMock
    });
  });

  it('should initialize redis storage', function() {
    expect(redisStorageMock).to.have.been.calledWith({
      namespace: 'standup',
      url: process.env.REDIS_URL
    });
  });

  it('should create the controller', function() {
    expect(botkitMock.slackbot).to.have.been.calledWithMatch({storage: storageObjMock});
  });

  it('should startRTM', function() {
    var fakeBot = {};
    controllerMock.startRTM.yield(null, fakeBot);
    expect(controllerMock.spawn).to.have.been.calledWith({token: process.env.SLACK_API_TOKEN});
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
