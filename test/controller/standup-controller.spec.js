// jshint expr:true
var chai = require('chai')
  , expect = chai.expect
  , sinon = require('sinon')
  , proxyquire = require('proxyquire').noCallThru()
  , _ = require('lodash')
  , q = require('q')
  , helpers = require('../helpers');

chai.use(require('sinon-chai'));

describe('Standup Controller', function() {
  var botMock
    , botController
    , usersModelMock
    , standupModelMock
    , convoMock
    , user
    , userIterator
    , standupController;

  beforeEach(function() {
    convoMock = {
      ask: sinon.stub(),
      next: sinon.stub(),
      say: sinon.stub(),
      on: sinon.stub,
      extractResponse: sinon.stub()
    };

    botMock = {
      reply: sinon.stub(),
      startConversation: sinon.stub().returns(convoMock),
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
      summarize: sinon.stub().returns(q())
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
        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /Alright/);
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
      var startCallback
        , endCallback;

      beforeEach(function() {
        startCallback = _.find(hearsMap, function(val, key) {
          return /^start$/.test(key);
        });

        endCallback = _.find(hearsMap, function(val, key) {
          return /^end/.test(key);
        });

        expect(startCallback).to.exist;
        expect(endCallback).to.exist;
      });

      it('should end an ongoing standup', function() {
        startCallback(botMock, messageMock);
        botMock.reply.reset();
        botMock.startConversation.reset();

        endCallback(botMock, messageMock);
        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /Standup is over/);
        expect(botMock.startConversation).to.have.been.calledWith(messageMock);
      });

      it('should not end if a standup has not started', function() {
        endCallback(botMock, messageMock);
        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /Standup is already over/);
        expect(botMock.startConversation).not.to.have.been.called;
      });

      describe('conversation', function() {
        var convoCallback;

        beforeEach(function() {
          startCallback(botMock, messageMock);
          endCallback(botMock, messageMock);
          convoCallback = botMock.startConversation.args[0][1];

          standupModelMock.getSummaryChannel.reset();

          sinon.spy(console, 'log');
        });

        afterEach(function() {
          console.log.restore();
        });

        it('should set up the conversation', function() {
          convoCallback(null, convoMock);

          expect(convoMock.ask).to.have.been.calledWithMatch(new RegExp(messageMock.user));
          expect(convoMock.ask.args[0][1]).to.be.an('Array');
          expect(convoMock.ask.args[0][1]).to.have.length(2);
        });

        it('should summarize the standup if told to', function() {
          var yesCfg;

          convoCallback(null, convoMock);

          yesCfg = convoMock.ask.args[0][1][0];
          expect(yesCfg.pattern).to.equal(botMock.utterances.yes);

          botMock.say.reset();
          return yesCfg.callback({}, convoMock)
            .then(function() {
              expect(standupModelMock.summarize).to.have.been.called;
              expect(standupModelMock.getSummaryChannel).to.have.been.called;
              expect(botMock.say).to.have.been.called;
              expect(botMock.say.args[0][0].channel).to.equal(messageMock.channel);
              expect(botMock.say.args[0][0].text).to.match(new RegExp('You can find a summary in'));
              expect(convoMock.next).to.have.been.called;
            });
        });

        it('should handle an error summarizing a standup', function() {
          var yesCfg
            , error = new Error('GUSFRING');

          convoCallback(null, convoMock);
          yesCfg = convoMock.ask.args[0][1][0];
          botMock.say.reset();

          standupModelMock.summarize.returns(q.reject(error));

          return yesCfg.callback({}, convoMock)
            .then(function() {
              expect(standupModelMock.summarize).to.have.been.called;
              expect(standupModelMock.getSummaryChannel).not.to.have.been.called;
              expect(console.log).to.have.been.calledWith(error);
              expect(botMock.say).to.have.been.called;
              expect(botMock.say.args[0][0].channel).to.equal(messageMock.channel);
              expect(botMock.say.args[0][0].text).to.match(new RegExp('I had a problem saving'));
              expect(convoMock.next).to.have.been.called;
            });
        });

        it('should clear statuses if no summary is needed', function() {
          var noCfg;

          convoCallback(null, convoMock);

          noCfg = convoMock.ask.args[0][1][1];
          expect(noCfg.pattern).to.equal(botMock.utterances.no);

          botMock.say.reset();
          noCfg.callback({}, convoMock);

          expect(standupModelMock.summarize).not.to.have.been.called;
          expect(standupModelMock.clearStatuses).to.have.been.called;
          expect(botMock.say).to.have.been.called;
          expect(botMock.say.args[0][0].channel).to.equal(messageMock.channel);
          expect(botMock.say.args[0][0].text).to.match(new RegExp('Come again soon'));
          expect(convoMock.next).to.have.been.called;
        });
      });
    });

    describe('start check-in', function() {

      beforeEach(function() {

      });

      it('should do nothing if not ready for status', function() {

      });

      it('should do nothing if response from other user', function() {

      });

      it('should gather status from current user', function() {

      });

      describe('conversation end', function() {

        beforeEach(function() {

        });

        it('should add status if convo is completed', function() {

        });

        it('should not add status if convo is not completed', function() {

        });
      });
    });

    describe('skip', function() {

      beforeEach(function() {

      });

      it('should do nothing if not ready for a status', function() {

      });

      it('should let current user skip', function() {

      });

      it('should let any user skip', function() {

      });

      it('should prompt next user if there is one', function() {

      });

      it('should summarize standup if no more users', function() {

      });

      it('should handle an error summarizing a standup', function() {

      });
    });
  });
});
