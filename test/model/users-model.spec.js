// jshint expr:true
var chai = require('chai')
  , expect = chai.expect
  , sinon = require('sinon')
  , path = require('path');

chai.use(require('sinon-chai'));

describe('Users Model', function() {
  var botMock
    , botController
    , UsersModel
    , userIds
    , user;

  beforeEach(function() {
    userIds = ['walterwhite'];
    user = {id: 'walterwhite', name: 'heisenberg'};

    botMock = {
      api: {
        users: {
          info: sinon.stub().yields(null, {user: user})
        }
      }
    };

    botController = {
      storage: {
        teams: {
          get: sinon.stub().yields(null, {userIds: userIds}),
          save: sinon.stub().yields(null)
        }
      }
    };

    delete require.cache[path.resolve('./src/model/users-model.js')];
    UsersModel = require('../../src/model/users-model');
  });

  describe('init', function() {

    it('should get ids from storage', function() {
      return UsersModel.init(botController, botMock)
        .then(function() {
          expect(botController.storage.teams.get).to.have.been.called;
          expect(botMock.api.users.info.callCount).to.equal(userIds.length);
        });
    });

    it('should handle no stored ids', function() {
      botController.storage.teams.get.yields(null, null);

      return UsersModel.init(botController, botMock)
        .then(function() {
          expect(botController.storage.teams.get).to.have.been.called;
          expect(botMock.api.users.info.callCount).to.equal(0);
        });
    });

    it('should handle missing userIds key', function() {
      botController.storage.teams.get.yields(null, {});

      return UsersModel.init(botController, botMock)
        .then(function() {
          expect(botController.storage.teams.get).to.have.been.called;
          expect(botMock.api.users.info.callCount).to.equal(0);
        });
    });
  });

  describe('add', function() {

    beforeEach(function() {
      return UsersModel.init(botController, botMock)
        .then(function() {
          botMock.api.users.info.reset();
        });
    });

    it('should add a user', function() {
      var userId = 'abc123';

      // needed to cache API functions
      return UsersModel.add(userId)
        .then(function(u) {
          expect(botMock.api.users.info).to.have.been.calledWith({user: userId});
          expect(botController.storage.teams.save).to.have.been.calledOnce;
          expect(u).to.equal(user);
        });
    });

    it('should add a user only once', function() {
      var userId = userIds[0];

      // needed to cache API functions
      return UsersModel.add(userId)
        .then(function(u) {
          expect(botMock.api.users.info).to.have.been.calledWith({user: userId});
          expect(botController.storage.teams.save).not.to.have.been.calledOnce;
          expect(u).to.equal(user);
        });
    });

    it('should fail save silently', function() {
      var userId = 'abc123';
      botController.storage.teams.save.yields(new Error('OOPS!'));

      // needed to cache API functions
      return UsersModel.add(userId)
        .then(function(u) {
          expect(botMock.api.users.info).to.have.been.calledWith({user: userId});
          expect(botController.storage.teams.save).to.have.been.calledOnce;
          expect(u).to.equal(user);
        });
    });
  });

  describe('remove', function() {

    beforeEach(function() {
      return UsersModel.init(botController, botMock)
        .then(function() {
          botMock.api.users.info.reset();
        });
    });

    it('should remove and return a user', function() {
      var userId = userIds[0];

      return UsersModel.remove(userId)
        .then(function(u) {
          expect(botController.storage.teams.save).to.have.been.calledWithMatch({userIds: []});
          expect(u).to.equal(user);
        });
    });

    it('should return undefined if user was not in team', function() {
      var userId = 'unknown';

      return UsersModel.remove(userId)
        .then(function(u) {
          expect(botController.storage.teams.save).to.have.been.calledWithMatch({userIds: userIds});
          expect(u).to.be.undefined;
        });
    });

    it('should fail save silently', function() {
      var userId = userIds[0];
      botController.storage.teams.save.yields(new Error('OOPS!'));

      return UsersModel.remove(userId)
        .then(function(u) {
          expect(botController.storage.teams.save).to.have.been.calledWithMatch({userIds: userIds});
          expect(u).to.equal(user);
        });
    });
  });

  describe('removeByName', function() {

    beforeEach(function() {
      sinon.spy(UsersModel, 'remove');
      return UsersModel.init(botController, botMock);
    });

    afterEach(function() {
      UsersModel.remove.restore();
    });

    it('should return undefined if user does not exist', function() {
      return UsersModel.removeByName('jessepinkman')
        .then(function(u) {
          expect(u).to.be.undefined;
          expect(UsersModel.remove).not.to.be.called;
        });
    });

    it('should call remove if user exists', function() {
      return UsersModel.removeByName(user.name)
        .then(function(u) {
          expect(u).to.equal(user);
          expect(UsersModel.remove).to.be.calledWith(user.id);
        });
    });
  });

  describe('list', function() {

    it('should list users', function() {
      return UsersModel.init(botController, botMock)
        .then(function() {
          var us = UsersModel.list();
          expect(us).to.deep.equal([user]);
        });
    });
  });

  describe('get', function() {

    it('should get a user by ID', function() {
      it('should list users', function() {
        return UsersModel.init(botController, botMock)
          .then(function() {
            var u = UsersModel.get(user.id);
            expect(u).to.equal(user);
          });
      });
    });
  });

  describe('exists', function() {

    beforeEach(function() {
      sinon.spy(UsersModel, 'get');
      return UsersModel.init(botController, botMock);
    });

    afterEach(function() {
      UsersModel.get.restore();
    });

    it('should return true for existing user', function() {
      var exists = UsersModel.exists(user.id);
      expect(UsersModel.get).to.have.been.calledWith(user.id);
      expect(exists).to.be.true;
    });

    it('should return false for non-existant user', function() {
      var exists = UsersModel.exists('jessepinkman');
      expect(UsersModel.get).to.have.been.calledWith('jessepinkman');
      expect(exists).to.be.false;
    });
  });

  describe('iterator', function() {

    beforeEach(function() {
      return UsersModel.init(botController, botMock);
    });

    describe('hasNext', function() {
      it('should return a boolean value based on whether there are more users', function() {
        var iterator = UsersModel.iterator();
        expect(iterator.hasNext()).to.be.true;
        iterator.next();
        expect(iterator.hasNext()).to.be.false;
      });
    });

    describe('next', function() {
      it('should get next user', function() {
        var iterator = UsersModel.iterator();
        expect(iterator.next()).to.deep.equal(user);
        expect(iterator.next()).to.be.undefined;
      });
    });
  });
});
