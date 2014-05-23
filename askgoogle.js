#!/usr/bin/env node

var http = require('http');
var elasticsearch = require('elasticsearch');

// --- ElasticSearch Stuff --- //

var clientEs = new elasticsearch.Client({
  host: '127.0.0.1:9200',
  apiVersion: '1.1'
});

function indexMsg(message, receipt) {
  clientEs.bulk({
    body: message
  }, function (err, resp) {
    if (err) {
      console.log(err);
    }
    else {
      console.log("Indexed");
    };
  });
};

// --- Google Stuff --- //

var args = process.argv.slice(2);
// What type of questions
var queries = [ "can", "how", "should", "does", "why" ]

var queryCount = queries.length;
for (var query = 0; query < queryCount; query++) {
  var options = {
    host: 'suggestqueries.google.com',
    port: 80,
    path: '/complete/search?client=firefox&q=' + queries[query] + "%20" + args
  };
  console.log("Requesting " + queries[query]);
  http.request(options, handleResponse).end();
}

function parseResponse(suggestions, callback) {
  var resp = JSON.parse(suggestions)[1];
  var docs = [];
  var count = resp.length;
  for (var i = 0; i < count; i++) {
    var doc = { index: { _index: 'google', _type: /^[\w\-]+/.exec(resp[0])[0], body: resp[i] } };
    docs.push(doc);
  }
  callback(docs);
}

function handleResponse(response) {
  var suggestions = '';
  response.on('data', function (chunk) {
    suggestions += chunk;
  });
  response.on('end', function () {
    parseResponse(suggestions, function(docs){
      indexMsg(docs);
    })
  });
}
