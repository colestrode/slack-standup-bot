// jshint expr:true
var chai = require('chai')
  , expect = chai.expect
  , sinon = require('sinon')
  , proxyquire = require('proxyquire').noCallThru()
  , _ = require('lodash')
  , helpers = require('../helpers');

chai.use(require('sinon-chai'));

describe('Standup Controller', function() {
  var botMock
    , botController
    , usersModelMock
    , standupModelMock
    , user
    , userIterator
    , standupController;

  beforeEach(function() {
    botMock = {
      reply: sinon.stub(),
      startConversation: sinon.stub(),
      say: sinon.stub(),
      utterances: {yes: /yes/, no: /no/}
    };

    botController = {
      hears: sinon.stub()
    };

    user = {name: 'heisenberg', id: 'walterwhite'};

    userIterator = {
      hasNext: sinon.stub(),
      next: sinon.stub().returns(user)
    };

    usersModelMock = {
      list: sinon.stub().returns([user]),
      iterator: sinon.stub().returns(userIterator)
    };

    standupModelMock = {
      getSummaryChannel: sinon.stub().returns('Netflix'),
      setSummaryChannel: sinon.stub(),
      addStatus: sinon.stub(),
      clearStatuses: sinon.stub(),
      summarize: sinon.stub()
    };

    standupController = proxyquire('../../src/controller/standup-controller', {
      '../model/users-model': usersModelMock,
      '../model/standup-model': standupModelMock
    });
  });

  it('should set up listeners', function() {
    standupController.use(botController);
    expect(botController.hears.callCount).to.equal(4);

    _.forEach(botController.hears.args, function(args) {
      expect(args).to.have.length(3);
      expect(args[2]).to.be.a.function;
    });
  });

  describe('hears', function() {
    var hearsMap
      , messageMock;

    beforeEach(function() {
      standupController.use(botController);
      hearsMap = helpers.createHearsMap(botController);

      messageMock = {
        channel: 'AMC',
        user: 'heisenberg'
      };
    });

    describe('start standup', function() {
      var callback;

      beforeEach(function() {
        callback = _.find(hearsMap, function(val, key) {
          return /^start$/.test(key);
        });

        expect(callback).to.exist;
      });

      it('should start a standup', function() {
        var sayArgs;

        callback(botMock, messageMock);

        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /^Alright!/);
        expect(standupModelMock.getSummaryChannel).to.have.been.called;
        expect(standupModelMock.setSummaryChannel).not.to.have.been.called;
        expect(usersModelMock.list).to.have.been.called;
        expect(usersModelMock.iterator).to.have.been.called;
        expect(userIterator.next).to.have.been.called;
        expect(botMock.say).to.have.been.called;

        sayArgs = botMock.say.firstCall.args[0];
        expect(sayArgs.text).to.match(new RegExp(messageMock.user.id));
        expect(sayArgs.channel).to.match(new RegExp(messageMock.channel));
      });

      it('should set a summary channel if one is not already set', function() {
        standupModelMock.getSummaryChannel.returns();

        callback(botMock, messageMock);

        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /^Alright!/);
        expect(standupModelMock.getSummaryChannel).to.have.been.called;
        expect(standupModelMock.setSummaryChannel).to.have.been.calledWith(messageMock.channel);
      });

      it('should not start if a standup is in progress', function() {
        callback(botMock, messageMock);
        botMock.reply.reset();
        botMock.say.reset();
        standupModelMock.getSummaryChannel.reset();
        usersModelMock.list.reset();
        usersModelMock.iterator.reset();
        userIterator.next.reset();

        callback(botMock, messageMock);
        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /^Standup has already started!/);
        expect(standupModelMock.getSummaryChannel).not.to.have.been.called;
        expect(usersModelMock.list).not.to.have.been.called;
        expect(usersModelMock.iterator).not.to.have.been.called;
        expect(userIterator.next).not.to.have.been.called;
        expect(botMock.say).not.to.have.been.called;
      });

      it('should not start if there are no users', function() {
        usersModelMock.list.returns([]);

        callback(botMock, messageMock);
        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /^Looks like no one/);
        expect(standupModelMock.getSummaryChannel).to.have.been.called;
        expect(usersModelMock.list).to.have.been.called;

        expect(usersModelMock.iterator).not.to.have.been.called;
        expect(userIterator.next).not.to.have.been.called;
        expect(botMock.say).not.to.have.been.called;
      });

    });

    describe('end', function() {

      beforeEach(function() {

      });

      it('should ', function() {

      });
    });

    describe('start check-in', function() {

      beforeEach(function() {

      });

      it('should ', function() {

      });
    });

    describe('skip', function() {

      beforeEach(function() {

      });

      it('should ', function() {

      });
    });
  });
});
