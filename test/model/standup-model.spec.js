// jshint expr:true
var chai = require('chai')
  , expect = chai.expect
  , sinon = require('sinon')
  , path = require('path')
  , moment = require('moment');

chai.use(require('sinon-chai'));

describe('Standup Model', function() {
  var botMock
    , botController
    , channel
    , StandupModel;

  beforeEach(function() {
    channel = 'amc';

    botMock = {
      api: {
        files: {
          upload: sinon.stub().yields(null, {})
        }
      }
    };

    botController = {
      storage: {
        teams: {
          get: sinon.stub().yields(null, {channel: channel}),
          save: sinon.stub().yields(null)
        }
      }
    };

    delete require.cache[path.resolve('./src/model/standup-model.js')];
    StandupModel = require('../../src/model/standup-model');
  });

  describe('init', function() {

    it('should request summary channel and set summaryChannel if found', function() {
      return StandupModel.init(botController, botMock)
        .then(function(ch) {
          expect(botController.storage.teams.get).to.have.been.calledWith('summarychannel');
          expect(ch).to.equal(channel);
        });
    });

    it('should request summary channel and set summaryChannel if not found', function() {
      botController.storage.teams.get.yields(null, undefined);
      return StandupModel.init(botController, botMock)
        .then(function(ch) {
          expect(botController.storage.teams.get).to.have.been.calledWith('summarychannel');
          expect(ch).to.be.undefined;
        });
    });

    it('should handle errors silently', function() {
      var err = new Error('OOPS!');
      botController.storage.teams.get.yields(err);

      return StandupModel.init(botController, botMock)
        .then(function() {
          throw new Error('should have failed');
        })
        .fail(function(e) {
          expect(botController.storage.teams.get).to.have.been.calledWith('summarychannel');
          expect(e).to.equal(err);
        });
    });
  });

  describe('setSummaryChannel', function() {

    beforeEach(function() {
      return StandupModel.init(botController, botMock)
        .then(function() {
          botController.storage.teams.get.reset();
        });
    });

    it('should save summary channel', function() {
      return StandupModel.setSummaryChannel('channel5')
        .then(function() {
          expect(botController.storage.teams.save).to.have.been.calledWithMatch({id: 'summarychannel', channel: 'channel5'});
        });
    });

    it('should return error if fails', function() {
      var err = new Error('OOPS!');
      botController.storage.teams.save.yields(err);

      return StandupModel.setSummaryChannel('channel5')
        .then(function() {
          throw new Error('should have failed');
        })
        .fail(function(e) {
          expect(botController.storage.teams.save).to.have.been.calledWithMatch({id: 'summarychannel', channel: 'channel5'});
          expect(e).to.equal(err);
        });
    });
  });

  describe('getSummaryChannel', function() {

    beforeEach(function() {
      return StandupModel.init(botController, botMock)
        .then(function() {
          botController.storage.teams.get.reset();
        });
    });

    it('should return summary channel', function() {
      expect(StandupModel.getSummaryChannel()).to.equal(channel);
    });
  });

  describe('Status', function() {
    it('should return empty array when not statuses have been added', function() {
      expect(StandupModel.getStatuses()).to.deep.equal([]);
    });

    it('should add and return status that has been added', function() {
      var status = {hi: 'there'};
      StandupModel.addStatus(status);
      expect(StandupModel.getStatuses()).to.deep.equal([status]);
    });

    it('should remove any added statuses', function() {
      var status = {hi: 'there'};
      StandupModel.addStatus(status);
      expect(StandupModel.getStatuses()).to.deep.equal([status]);

      StandupModel.clearStatuses();
      expect(StandupModel.getStatuses()).to.deep.equal([]);
    });
  });

  describe('summarize', function() {
    var title;

    beforeEach(function() {
      title = 'Standup for ' + moment().format('YYYY-MM-DD');
      return StandupModel.init(botController, botMock)
        .then(function() {
          botController.storage.teams.get.reset();
          return StandupModel.setSummaryChannel('superlab');
        });
    });

    it('should upload a single status for short updates', function() {
      var status = {
        user: {name: 'walterwhite'},
        yesterday: 'made some blue stuff',
        today: 'made some more blue stuff',
        obstacles: 'gus fring'
      };
      StandupModel.addStatus(status);

      sinon.spy(StandupModel, 'clearStatuses');

      return StandupModel.summarize()
        .then(function() {
          expect(botMock.api.files.upload).to.have.been.calledOnce;
          expect(botMock.api.files.upload).to.have.been.calledWithMatch({
            filetype: 'post',
            filename: title,
            title: title,
            channels: 'superlab'
          });
          expect(StandupModel.clearStatuses).to.have.been.called;
        });
    });

    it('should upload multiple statuses for long updates', function() {
      StandupModel.addStatus({
        user: {name: 'walterwhite'},
        yesterday: getText(),
        today: 'crystalbluepersuasion',
        obstacles: 'gus fring'
      });

      StandupModel.addStatus({
        user: {name: 'jessepinkman'},
        yesterday: getText(),
        today: 'crystalbluepersuasion',
        obstacles: 'walter'
      });

      sinon.spy(StandupModel, 'clearStatuses');

      return StandupModel.summarize()
        .then(function() {
          expect(botMock.api.files.upload).to.have.been.calledTwice;
          expect(botMock.api.files.upload.firstCall).to.have.been.calledWithMatch({
            filetype: 'post',
            filename: title + ' (1 of 2)',
            title: title + ' (1 of 2)',
            channels: 'superlab'
          });
          expect(botMock.api.files.upload.secondCall).to.have.been.calledWithMatch({
            filetype: 'post',
            filename: title + ' (2 of 2)',
            title: title + ' (2 of 2)',
            channels: 'superlab'
          });

          expect(StandupModel.clearStatuses).to.have.been.called;
        });
    });

    it('should replace \\n with \\n\\n', function() {
      var status = {
        user: {name: 'walterwhite'},
        yesterday: 'blue\nstuff',
        today: 'blue\nstuff',
        obstacles: 'gus fring'
      };
      StandupModel.addStatus(status);

      return StandupModel.summarize()
        .then(function() {
          expect(botMock.api.files.upload).to.have.been.calledOnce;
          var summary = botMock.api.files.upload.args[0][0].content;

          expect(summary).to.match(/blue\n\nstuff/);
        });
    });

    it('should handle errors in upload', function() {
      var status = {
          user: {name: 'walterwhite'},
          yesterday: 'made some blue stuff',
          today: 'made some more blue stuff',
          obstacles: 'gus fring'
        }
        , error = new Error('DINGDINGBOOM');

      StandupModel.addStatus(status);

      sinon.spy(StandupModel, 'clearStatuses');
      botMock.api.files.upload.yields(error);

      return StandupModel.summarize()
        .then(function() {
          throw new Error('should have failed');
        })
        .fail(function(err) {
          expect(err.message).to.equal('DINGDINGBOOM');
          expect(StandupModel.clearStatuses).to.have.been.called;
        });
    });
  });

  function getText() {
    // 2K characters
    return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas egestas eros dolor, et interdum metus mattis vel. Proin cursus suscipit sem non fringilla. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nulla est leo, dignissim eget pharetra a, luctus in urna. Morbi malesuada pellentesque quam, quis posuere nisl ultricies in. Maecenas pharetra sem id nulla pretium dignissim. Vivamus consectetur dolor ut gravida hendrerit. Nam dictum luctus semper. Aliquam tincidunt odio velit, eu accumsan purus pellentesque in. Proin cursus sem lorem, nec sodales felis sagittis ac. Sed et lacus vitae magna tempor varius. Duis lacinia urna eget erat pharetra, a rutrum ante aliquet. Mauris porta gravida ipsum non aliquam. Vestibulum bibendum luctus imperdiet.' +
      'Aliquam vel augue sapien. Vestibulum quam est, commodo sed diam in, imperdiet condimentum elit. Fusce et mollis tortor, ut ultrices purus. Sed dui elit, elementum in diam et, mollis dictum turpis. Nam tincidunt maximus lorem dapibus tempor. Nullam sodales orci sodales eros tincidunt congue. Vivamus ultricies neque at mauris efficitur dapibus. Sed dolor quam, euismod ac tempus eget, accumsan id tortor. Nullam eu placerat mi. Maecenas rhoncus ultrices magna. Nulla viverra mauris urna, in condimentum metus varius nec. Integer blandit nec mi ut gravida. Curabitur consectetur magna ac libero commodo sodales.' +
      'Vivamus gravida enim non ex iaculis, quis fringilla lorem vestibulum. Aliquam tristique aliquet turpis vitae sodales. Proin sed leo eleifend, vehicula nunc sit amet, scelerisque purus. Aliquam non rutrum eros, sed dignissim nisl. Etiam ac orci fringilla, dignissim risus ac, convallis tellus. Vestibulum dignissim consectetur metus, nec rhoncus nunc iaculis sit amet. Fusce quis semper augue. Phasellus rutrum nibh eget sollicitudin vehicula.' +
      'Pellentesque vulputate magna ut orci ultricies bibendum. Donec lacinia tincidunt leo, vel semper risus fringilla ut. Integer ut malesuada sem. Etiams.';
  }
});
