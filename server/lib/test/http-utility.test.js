var assert = require('assert'),
    HttpUtility = require('../http-utility.js'),
    nock = require('nock');

describe('HttpUtility', function () {

    beforeEach(function () {
        this.client = new HttpUtility({});
    });

    afterEach(function () {
        nock.cleanAll();
    });

    describe('#makeRequest()', function () {

        it('should not error on a valid JSON response', function (done) {
            nock('https://w.chain.com').get('/').reply(200, '{}');
            this.client.makeRequest({
                method: 'GET',
                path: '/'
            }, function (err) {
                assert(!err);
                done();
            });
        });

        it('should return an error on non-200 response', function (done) {
            nock('https://w.chain.com').get('/').reply(400, '');
            this.client.makeRequest({
                method: 'GET',
                path: '/'
            }, function (err) {
                assert(err);
                assert(err.message.match(/bad status code/));
                done();
            });
        });

        it('should return an error on an unparseable JSON response', function (done) {
            nock('https://w.chain.com').get('/').reply(200, 'NOT JSON');
            this.client.makeRequest({
                method: 'GET',
                path: '/'
            }, function (err) {
                assert(err);
                assert(err.message.match(/could not decode JSON/));
                done();
            });
        });

    });

});
