"use strict"
var request = require('request')
var fs = require('fs')
var path = require('path')

var URL = 'https://w.chain.com'
var PEM = fs.readFileSync(path.join(__dirname, './chain.pem'))

module.exports = HttpUtility

function HttpUtility(c) {
    if (!c.url) {
        c.url = URL
    }
    this.url = c.url
    this.auth = c.auth
    this.timeout = c.timeout
}

HttpUtility.prototype.makeRequest = function (config, cb) {
    var usingJson = false
    var r = {
        strictSSL: true,
        cert: PEM,
        auth: this.auth,
        method: config.method,
        uri: this.url + config.path,
        timeout: this.timeout,
        headers: config.headers || {},
    }
    if (config.body) {
        usingJson = true
        r.json = config.body
    }
    if (config.query) {
        r.qs = config.query
    }

    request(r, function (err, resp, body) {
        if (err) {
            return cb(err)
        }

        if (Math.floor(resp.statusCode / 100) !== 2) {
            err = new Error("Chain SDK error: bad status code " + resp.statusCode.toString() + ". See 'resp' property for more detail.")
            err.resp = resp
            return cb(err)
        }

        if (usingJson) {
            return cb(null, body)
        }

        var parsed
        try {
            parsed = JSON.parse(body)
        } catch (e) {
            err = new Error("Chain SDK error: could not decode JSON response, see 'error' and 'resp' properties for more detail")
            err.error = e
            err.resp = resp
            return cb(err)
        }

        cb(null, parsed, resp)
    })
}

HttpUtility.prototype.post = function (path, body, cb) {
    this.makeRequest({
        method: 'POST',
        path: path,
        body: body
    }, cb)
}

HttpUtility.prototype.delete = function (path, cb) {
    this.makeRequest({
        method: 'DELETE',
        path: path
    }, cb)
}

HttpUtility.prototype.get = function (path, query, cb) {
    if (typeof query === 'function') {
        cb = query
        query = null
    }

    this.makeRequest({
        method: 'GET',
        path: path,
        query: query
    }, cb)
}
