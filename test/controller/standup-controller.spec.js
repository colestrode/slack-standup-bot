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
    , hasNextCallback
    , standupController;

  beforeEach(function() {
    convoMock = {
      ask: sinon.stub(),
      next: sinon.stub(),
      say: sinon.stub(),
      on: sinon.stub(),
      extractResponse: sinon.stub()
    };

    botMock = {
      reply: sinon.stub(),
      startConversation: sinon.stub().returns(convoMock),
      startPrivateConversation: sinon.stub().returns(convoMock),
      say: sinon.stub(),
      utterances: {yes: /yes/, no: /no/}
    };

    botController = {
      hears: sinon.stub()
    };

    user = {name: 'heisenberg', id: 'walterwhite'};

    hasNextCallback = sinon.stub();
    hasNextCallback.onFirstCall().returns(true);
    hasNextCallback.onSecondCall().returns(false);
    userIterator = {
      hasNext: hasNextCallback,
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
      getStatuses: sinon.stub(),
      clearStatuses: sinon.stub(),
      summarizeUser: sinon.stub().returns(q()),
      summarize: sinon.stub().returns(q()),
      addResponsiveUser: sinon.stub().returns(q()),
      getResponsiveUsers: sinon.stub().returns([user]),
      isResponsiveUser: sinon.stub().returns(false),
      clearResponsiveUsers: sinon.stub()
    };

    standupModelMock.getStatuses.returns([]);

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

  it('should check statuses while setting up', function() {
    standupController.use(botController);
    expect(standupModelMock.getStatuses).to.have.been.called;
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

    describe('remind silent users', function() {
      var remindCallback
      , startCallback
      , convoCallback;

      beforeEach(function() {
        remindCallback = _.find(hearsMap, function(val, key) {
          return /^remind$/.test(key);
        });

        startCallback = _.find(hearsMap, function(val, key) {
          return /^start$/.test(key);
        });

        expect(remindCallback).to.exist;
        expect(startCallback).to.exist;
      });

      it('should pester silent users', function() {
        // make it so there are more regular users
        usersModelMock.list.returns([user, user]);
        startCallback(botMock, messageMock);
        hasNextCallback.reset();
        remindCallback(botMock, messageMock);
        expect(botMock.startPrivateConversation.callCount).to.equal(2);
        convoCallback = botMock.startPrivateConversation.secondCall.args[1];
        convoCallback(null, convoMock);
        expect(convoMock.say).to.have.been.calledWithMatch(/Please check in.*/);
      });

      it('should not pester users who already responded', function() {
        startCallback(botMock, messageMock);
        hasNextCallback.reset();
        // sneak in a fake user so they don't show up in silentUsers, making them seem like
        // they've responded
        userIterator.next.returns({name: 'test', id: 'id'});
        botMock.startPrivateConversation.reset();
        remindCallback(botMock, messageMock);
        expect(botMock.startPrivateConversation).to.not.have.been.called;
      });

      it('should not remind anyone if there\'s no standup', function() {
        remindCallback(botMock, messageMock);
        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /.*no standup.*/);
        expect(botMock.startPrivateConversation.callCount).to.equal(0);
      });

      it('should not bother reminding people if everyone\'s responded', function() {
        startCallback(botMock, messageMock);
        hasNextCallback.reset();
        remindCallback(botMock, messageMock);
        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /.*everyone seems to have responded.*/);
        expect(hasNextCallback).to.not.have.been.called;
      });

    });
    describe('generate report', function() {
      var reportCallback
      , startCallback;

      beforeEach(function() {
        reportCallback = _.find(hearsMap, function(val, key) {
          return /^report$/.test(key);
        });

        startCallback = _.find(hearsMap, function(val, key) {
          return /^start$/.test(key);
        });

        expect(reportCallback).to.exist;
        expect(startCallback).to.exist;
      });

      it('should complain when called on to report without a standup', function() {
        reportCallback(botMock, messageMock);
        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /no standup/);
        expect(standupModelMock.summarize).not.to.have.been.called;
      });

      it('should summarize and print silent users', function() {
        startCallback(botMock, messageMock);
        hasNextCallback.reset();
        reportCallback(botMock, messageMock);
        expect(standupModelMock.summarize).to.have.been.called;
        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, new RegExp(messageMock.user));
      });
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
        callback(botMock, messageMock);

        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /^Alright!/);
        expect(standupModelMock.getStatuses).to.have.been.called;
        expect(standupModelMock.getSummaryChannel).to.have.been.called;
        expect(standupModelMock.setSummaryChannel).not.to.have.been.called;
        expect(usersModelMock.list).to.have.been.called;
        expect(usersModelMock.iterator).to.have.been.called;
        expect(userIterator.next).to.have.been.called;
      });

      it('should set a summary channel if one is not already set', function() {
        standupModelMock.getSummaryChannel.returns();

        callback(botMock, messageMock);

        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /^Alright!/);
        expect(standupModelMock.getSummaryChannel).to.have.been.called;
        expect(standupModelMock.setSummaryChannel).to.have.been.calledWith(messageMock.channel);
      });

      it('should not start if a standup is there are pre-existing statuses', function() {
        // trigger the code to toggle whether a standup is happening based on
        // existing statuses
        standupModelMock.getStatuses.returns(['test']);
        standupController.use(botController);
        callback(botMock, messageMock);
        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /^Standup has already started!/);
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

      it('should end an ongoing standup with users who haven\'t responded', function() {
        startCallback(botMock, messageMock);
        botMock.reply.reset();
        hasNextCallback.reset();
        endCallback(botMock, messageMock);
        // verify that since no users responded, this information is printed out on completion
        expect(botMock.say.firstCall.args[0].text).to.match(new RegExp(messageMock.user));
        expect(botMock.say.secondCall.args[0].text).to.match(/Standup is over/);
        expect(standupModelMock.summarize).to.have.been.called;
        expect(standupModelMock.clearStatuses).to.have.been.called;
      });

      it('should not end if a standup has not started', function() {
        endCallback(botMock, messageMock);
        expect(botMock.reply).to.have.been.calledWithMatch(messageMock, /Standup is already over/);
        expect(botMock.startConversation).not.to.have.been.called;
      });
    });

    describe('start check-in', function() {
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
        hasNextCallback.reset();
      });
      it('should prompt multiple users', function() {
        hasNextCallback.onFirstCall().returns(true);
        hasNextCallback.onSecondCall().returns(true);
        hasNextCallback.onThirdCall().returns(false);
        botMock.startPrivateConversation.reset();
        startCallback(botMock, messageMock);
        // the hackery above will cause two users to be output to the start function
        // the expectation is that a conversation will be started with both of them
        // simultaneously
        expect(botMock.startPrivateConversation.callCount).to.equal(2);
      });

      it('should gather status', function() {
        var convoCallback;

        botMock.startPrivateConversation.reset();
        startCallback(botMock, messageMock);

        // test convo callback
        convoCallback = botMock.startPrivateConversation.firstCall.args[1];
        convoCallback(null, convoMock);

        expect(convoMock.ask.callCount).to.equal(3);
        expect(convoMock.say).to.have.been.calledWithMatch(/Great/);
        expect(convoMock.on).to.have.been.calledWith('end');

        _.forEach(convoMock.ask.args, function(args) {
          convoMock.next.reset();
          args[1](null, convoMock);
          expect(convoMock.next).to.have.been.called;
        });
      });

      describe('conversation end', function() {
        var onEnd;

        beforeEach(function() {
          messageMock.user = 'walterwhite';
          messageMock.channel = 'walterwhite';
          botMock.startPrivateConversation.reset();
          startCallback(botMock, messageMock);
          hasNextCallback.reset();

          botMock.startPrivateConversation.firstCall.args[1](null, convoMock);

          onEnd = convoMock.on.args[0][1];
          expect(onEnd).to.exist;
        });

        it('should add status if private convo is completed', function() {
          convoMock.status = 'completed';
          standupModelMock.summarizeUser.reset();
          standupModelMock.isResponsiveUser.returns(false);

          return onEnd(convoMock)
            .then(function() {
              expect(standupModelMock.addStatus).to.have.been.called;
              expect(standupModelMock.summarizeUser).to.have.been.called;

              expect(botMock.say).not.to.have.been.called;
            });
        });

        it('should end standup if everyone is done', function() {
          convoMock.status = 'completed';
          standupModelMock.summarizeUser.reset();
          standupModelMock.isResponsiveUser.returns(true);

          return onEnd(convoMock)
            .then(function() {
              // make sure we do our regular status update
              expect(standupModelMock.addStatus).to.have.been.called;
              expect(standupModelMock.summarizeUser).to.have.been.called;

              // now the standup ending
              // note that we only expect one call to 'say' since there aren't any silent users
              expect(botMock.say.firstCall.args[0].text).to.match(/Standup is over/);
              expect(standupModelMock.clearStatuses).to.have.been.called;
              expect(standupModelMock.summarize).to.have.been.called;
            });
        });

        it('should handle an error summarizing', function() {
          convoMock.status = 'completed';
          userIterator.hasNext.returns(false);
          standupModelMock.summarizeUser.returns(q.reject(new Error('GUSFRING')));

          return onEnd(convoMock).then(function() {
            expect(standupModelMock.summarizeUser).to.have.been.called;

            expect(botMock.say).to.have.been.called;
            expect(botMock.say.args[1][0].text).to.match(/Error showing status/);
            expect(botMock.say.args[1][0].channel).to.equal(messageMock.channel);
          });
        });

        it('should not add status if convo is not completed', function() {
          convoMock.status = 'blueglass';
          return onEnd(convoMock)
            .then(function() {
              expect(standupModelMock.addStatus).not.to.have.been.called;
            });
        });
      });
    });

  });
});
