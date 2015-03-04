var assert = require('assert')
  , request = require('supertest')
  , app = require(process.cwd() + '/app.js').app
  , assert = require('assert')
  , sinon = require('sinon')
  , redis = require(process.cwd() + '/lib/redis')
  , debug = require('debug')('sid:test')
  , util = require('util')
;

describe('comments controller', function() {
  
  describe('session lookup', function() {

    var stub_redis;
    var goodSessionId = '01234';
    var goodUserId = '98765';
    
    before(function(done) {
      //
      // Mock redis so it doesn't need to be running and rely on keys to exist
      //
      stub_redis = sinon.stub(redis, 'getClient', function() {
        debug('(mock) redis call getClient()');
        return {
          get: function(key, cb) {
            debug('(mock) redis call to get with key: ' + util.inspect(key));
            if (key === 'sessionuser:' + goodSessionId) {
              cb(null, goodUserId);
            } else if (key === 'sessionuser:causeerror') {
              cb('mock redis error!');
            } else {
              cb(null, null);
            }
          }
        };
      });

      done();
    });
    
    var url = '/api/v1/comments';

    it('should fail for missing header', function (done) {
      request(app).
        get(url).
        expect(401).
        expect('WWW-Authenticate', /missing Authorization header/).
        end(done);
    });
    
    it('should fail for malformed header', function (done) {
      request(app).
        get(url).
        set('Authorization', 'uggabugga').
        expect(401).
        expect('WWW-Authenticate', /header must be of format/).
        end(done);
    });

    it('should still respond if db error', function (done) {
      request(app).
        get(url).
        set('Authorization', 'Bearer causeerror').
        expect(500).
        end(done);
    });

    it('should fail for nonexistant session id', function (done) {
      request(app).
        get(url).
        set('Authorization', 'Bearer uggabugga').
        expect(401).
        expect('WWW-Authenticate', /invalid or expired session id/).
        end(done);
    });
    
    it('should get expected user id for good session id', function (done) {
      request(app).
        get(url).
        set('Authorization', 'Bearer ' + goodSessionId).
        expect(function(res) {
          debug(res.text);
        }).
        end(done);
    });
    
    after(function() {
      stub_redis.restore();
    });
    
  });
});

