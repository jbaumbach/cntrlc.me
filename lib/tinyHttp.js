var http = require('http')
  , https = require('https')
  , urlLib = require('url')
  , _ = require('underscore')
  , util = require('util')
;

//
// Tiny library to do limited HTTP calling
//
// options:
//  secure: true for https, otherwise it'll be http
//  url: the full url
//  method: string method, like 'GET', 'POST' (must be uppercase)
//  body: the data to 'POST' or 'PUT'
//  noparse: true to NOT do a JSON.parse()
//
// callback: function with signature:
//  err: filled in if something bad happened
//  result: object containing the result body of the call
//  res: the full http response object, with things like "statusCode" and "headers"
//
var executeCall = exports.executeCall = function(options, callback) {
  var body = '';
  var retries = 0;
  var exited;
  var httpLib = options.secure ? https : http;
  var url = options.url;
  var timeoutMs = options.timeoutMs || 10000;

  var debug = false;

  if (!url) {
    url = options;
  }

  var httpOptions = _.extend(_.pick(urlLib.parse(url), 'host', 'hostname', 'path', 'port'), {
    method: options.method || 'GET'
  });

  var needBody = options.method == 'POST' || options.method == 'PUT';
  
  if (needBody) {
    httpOptions.headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  
  function done(err, result, res) {
    process.stdout.write('d');
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    if (!exited) {
      exited = true;
      process.stdout.write('>');
      callback(err, result, res);
    } else {
      // Note: this can occasionally happen if there's an exception in your code "at or around
      // using this library".  It doesn't make any sense.
      process.stdout.write('!');
    }
  }

  var timeout = setTimeout(function() {
    process.stdout.write('t');
    done(new Error('Timeout after ' + retries + ' attempts (' + timeoutMs + ' ms)'));
  }, timeoutMs);

  if (debug) console.log('http options: ' + util.inspect(httpOptions));

  var req = httpLib.request(httpOptions, function(res) {
    res.on('data', function(chunk) {
      process.stdout.write('+');
      body += chunk;
    });
    res.on('end', function() {
      process.stdout.write('=');
      var err, result;
      try {
        result = options.noparse ? body : JSON.parse(body);
      } catch (e) {
        err = e;
      }
      done(err, result, res);
    });
  }).
    on('error', function(e) {
      process.stdout.write('e');
      done(e);
    });
  
  if (needBody) {
    var postBody = _.map(options.body, function(value, key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(value);
    }).join('&');
    if (debug) console.log('postBody: ' + util.inspect(postBody));
      
    req.write(postBody);
  } else {
    if (debug) console.log('using GET');
  }

  process.stdout.write('<');

  // Kick off the request.  I think this should be named 'start()' or 'go()' or something.
  req.end();
};
