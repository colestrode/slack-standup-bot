var chai = require('chai')
  , expect = chai.expect
  , sinon = require('sinon')
  , proxyquire = require('proxyquire')
  , _ = require('lodash')
  , helpers = require('../helpers');

chai.use(require('sinon-chai'));

describe('Users Model', function() {
    var botMock
      , botController
      , UsersModel;

  beforeEach(function() {
    botMock = {
      api: {
        users: {
          info: sinon.stub()
        }
      }
    };

    botController = {
      storage: {
        teams: {
          get: sinon.stub(),
          save: sinon.stub()
        }
      }
    };

    UsersModel = require('../../model/users-model');
  });

  describe.skip('init', function() {

    beforeEach(function() {

    });

    it('should get ids from storage', function() {
      return UsersModel.init(botController, botMock)
        .then(function() {
          console.log(arguments);
        });
    });
  });

  describe('add', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });

  describe('add', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });

  describe('remove', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });

  describe('removebyName', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });

  describe('list', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });

  describe('get', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });

  describe('exists', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });

  describe('iterator', function() {

    beforeEach(function() {

    });

    it('should ', function() {

    });
  });
});
