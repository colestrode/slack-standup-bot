// jshint expr:true
var chai = require('chai')
  , expect = chai.expect
  , sinon = require('sinon')
  , proxyquire = require('proxyquire').noCallThru()
  , _ = require('lodash')
  , helpers = require('../helpers');

chai.use(require('sinon-chai'));

describe('User Controller', function() {
  var botMock
    , botController
    , usersModelMock
    , user
    , userController;

  beforeEach(function() {
    botMock = {
      reply: sinon.stub()
    };

    botController = {
      hears: sinon.stub()
    };

    user = {name: 'heisenberg'};

    usersModelMock = {
      add: sinon.stub().returns(helpers.resolves(user)),
      remove: sinon.stub().returns(helpers.resolves(user)),
      removeByName: sinon.stub().returns(helpers.resolves(user)),
      list: sinon.stub().returns([user])
    };

    userController = proxyquire('../../src/controller/users-controller', {
      '../model/users-model': usersModelMock
    });
  });

  it('should set up listeners', function() {
    userController.use(botController);
    expect(botController.hears).to.have.been.called;
    expect(botController.hears.firstCall.args).to.have.length(3);
    expect(botController.hears.firstCall.args[2]).to.be.a.function;
  });

  describe('hears', function() {
    var hearsMap;

    beforeEach(function() {
      userController.use(botController);
      hearsMap = helpers.createHearsMap(botController);
    });

    describe('add', function() {
      var addCallback;

      beforeEach(function() {
        addCallback = _.find(hearsMap, function(val, key) {
          return /add/.test(key);
        });

        sinon.spy(console, 'log');
        expect(addCallback).to.exist;
      });

      afterEach(function() {
        console.log.restore();
      });

      it('should add a user to the list in mid sentence tag', function() {
        var message = {user: 'walterwhite', text: 'asdf @' + user.name + ' sadf'};

        return addCallback(botMock, message)
          .then(function() {
            expect(usersModelMock.add).to.have.been.calledWith(user.name);
            expect(console.log).not.to.have.been.called;
            // really this is not testing anything we just did, this function is stubbed to always
            // return user.name, but it's nice for completion's sake
            expect(botMock.reply).to.have.been.calledWith(message, 'added ' + user.name + ' to the team!');
          });
      });

      it('should fail to add an invalid user', function() {
        var message = {user: 'walterwhite', text: 'asdf @' + user.name + ' sadf'};
        usersModelMock.add.returns(helpers.resolves(null));

        return addCallback(botMock, message)
          .then(function() {
            expect(usersModelMock.add).to.have.been.calledWith(user.name);
            expect(botMock.reply).to.have.been.calledWith(message, user.name + ' does not seem to exist :confused:');
          });
      });

      it('should fail to add invalid text', function() {
        var message = {user: 'walterwhite', text: 'asdf sadf'};

        return addCallback(botMock, message)
          .then(function() {
            expect(usersModelMock.add).to.not.have.been.called;
            expect(botMock.reply).to.have.been.calledWith(message, 'I couldn\'t see a tagged user in "asdf sadf"');
          });
      });
    });

    describe('join', function() {
      var joinCallback;

      beforeEach(function() {
        joinCallback = _.find(hearsMap, function(val, key) {
          return /join/.test(key);
        });

        sinon.spy(console, 'log');
        expect(joinCallback).to.exist;
      });

      afterEach(function() {
        console.log.restore();
      });

      it('should add a user to the list', function() {
        var message = {user: 'walterwhite'};

        return joinCallback(botMock, message)
          .then(function() {
            expect(usersModelMock.add).to.have.been.calledWith(message.user);
            expect(console.log).not.to.have.been.called;
            expect(botMock.reply).to.have.been.called;
          });
      });

      it('should reply and log an error if adding fails', function() {
        var err = new Error('OOPS!')
          , message = {user: 'walterwhite'};

        usersModelMock.add.returns(helpers.rejects(err));

        return joinCallback(botMock, message)
          .then(function() {
            expect(usersModelMock.add).to.have.been.calledWith(message.user);
            expect(console.log).to.have.been.calledWith(err);
            expect(botMock.reply).to.have.been.called;
          });
      });
    });

    describe('leave', function() {
      var leaveCallback
        , message;

      beforeEach(function() {
        message = {user: 'walterwhite'};

        leaveCallback = _.find(hearsMap, function(val, key) {
          return /leave/.test(key);
        });

        expect(leaveCallback).to.exist;
      });

      it('should let user leave team if they exist', function() {
        return leaveCallback(botMock, message)
          .then(function() {
            expect(usersModelMock.remove).to.have.been.calledWith(message.user);
            expect(botMock.reply).to.have.been.called;
            expect(botMock.reply.firstCall.args[1]).to.match(new RegExp(user.name));
          });
      });

      it('should reply if user is not in team', function() {
        usersModelMock.remove.returns(helpers.resolves());

        return leaveCallback(botMock, message)
          .then(function() {
            expect(usersModelMock.remove).to.have.been.calledWith(message.user);
            expect(botMock.reply).to.have.been.called;
            expect(botMock.reply.firstCall.args[1]).to.match(new RegExp('Um, this is awkward'));
          });
      });

      it('should log an error if remove failed', function() {
        var err = new Error('OOPS!');

        usersModelMock.remove.returns(helpers.rejects(err));
        sinon.spy(console, 'log');

        return leaveCallback(botMock, message)
          .then(function() {
            expect(usersModelMock.remove).to.have.been.calledWith(message.user);
            expect(console.log).to.have.been.calledWith(err);
            expect(botMock.reply).to.have.been.called;
            expect(botMock.reply.firstCall.args[1]).to.match(new RegExp('Oops!'));
          })
          .finally(function() {
            console.log.restore();
          });
      });
    });

    describe('remove', function() {
      var removeCallback
        , message;

      beforeEach(function() {
        message = {match: ['walterwhite']};

        removeCallback = _.find(hearsMap, function(val, key) {
          return /remove/.test(key);
        });

        expect(removeCallback).to.exist;
      });

      it('should get user by user id', function() {
        message.match[1] = '<@abc123>';
        return removeCallback(botMock, message)
          .then(function() {
            expect(usersModelMock.remove).to.have.been.calledWith('abc123');
            expect(botMock.reply).to.have.been.called;
            expect(botMock.reply.firstCall.args[1]).to.match(new RegExp(user.name));
          });
      });

      it('should get user by @username', function() {
        message.match[1] = '@heisenberg';
        return removeCallback(botMock, message)
          .then(function() {
            expect(usersModelMock.removeByName).to.have.been.calledWith('heisenberg');
            expect(botMock.reply).to.have.been.called;
            expect(botMock.reply.firstCall.args[1]).to.match(new RegExp(user.name));
          });
      });

      it('should user by bare username', function() {
        message.match[1] = 'heisenberg';
        return removeCallback(botMock, message)
          .then(function() {
            expect(usersModelMock.removeByName).to.have.been.calledWith('heisenberg');
            expect(botMock.reply).to.have.been.called;
            expect(botMock.reply.firstCall.args[1]).to.match(new RegExp(user.name));
          });
      });

      it('should handle if user is not found', function() {
        message.match[1] = '<@abc123>';
        usersModelMock.remove.returns(helpers.resolves());

        return removeCallback(botMock, message)
          .then(function() {
            expect(usersModelMock.remove).to.have.been.calledWith('abc123');
            expect(botMock.reply).to.have.been.called;
            expect(botMock.reply.firstCall.args[1]).to.match(new RegExp('Um, this is awkward'));
          });
      });

      it('should handle errors getting user', function() {
        var err = new Error('OOPS!');
        message.match[1] = '<@abc123>';
        usersModelMock.remove.returns(helpers.rejects(err));

        sinon.spy(console, 'log');

        return removeCallback(botMock, message)
          .then(function() {
            expect(usersModelMock.remove).to.have.been.calledWith('abc123');
            expect(console.log).to.have.been.calledWith(err);
            expect(botMock.reply).to.have.been.called;
            expect(botMock.reply.firstCall.args[1]).to.match(new RegExp('Oops!'));
          })
          .finally(function() {
            console.log.restore();
          });
      });
    });

    describe('members', function() {
      var members
        , listCallback;

      beforeEach(function() {
        members = [user, {name: 'capncook'}];
        usersModelMock.list.returns(members);

        listCallback = _.find(hearsMap, function(val, key) {
          return /list/.test(key);
        });

        expect(listCallback).to.exist;
      });

      it('should list members as a comma delimited list', function() {
        listCallback(botMock, {});
        expect(botMock.reply).to.have.been.called;
        expect(botMock.reply.firstCall.args[1]).to.match(new RegExp('Current members: heisenberg, capncook'));
      });

      it('should reply if there are no members', function() {
        usersModelMock.list.returns([]);
        listCallback(botMock, {});
        expect(botMock.reply).to.have.been.called;
        expect(botMock.reply.firstCall.args[1]).to.match(new RegExp('Nobody!'));
      });
    });
  });
});
