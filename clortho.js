'use strict';

var https = require('https');
var REQUEST_PARAMS = {
  hostname: 'api.github.com',
  path: '/teams/' + process.env.GITHUB_TEAM_ID + '/members',
  auth: process.env.GITHUB_USERNAME + ':' + process.env.GITHUB_TOKEN,
  headers: {
    'User-Agent' : 'PRX Clortho'
  }
};
var OVERRIDES;
try {
  OVERRIDES = JSON.parse(process.env.OVERRIDES);
} catch (e) {
  OVERRIDES = {};
}

function getUsername(login) {
  if (typeof OVERRIDES[login] !== 'undefined') { return OVERRIDES[login]; }
  return login;
}

function getMembers() {
  https.request(REQUEST_PARAMS, handleMembersRequest).end();
}

function handleMembersRequest(response) {
  var data = [];
  response.on('data', function (chunk) {
    data.push(chunk.toString());
  });
  response.on('end', function () {
    handleMembersResult(JSON.parse(data.join('')));
  });
}

function handleMembersResult(result) {
  for (var user of result) {
    var username = getUsername(user.login);
    console.log('useradd ' + username);
    getKeys(user.login, username);
  }
}

function getKeys(githubLogin, username) {
  var params = JSON.parse(JSON.stringify(REQUEST_PARAMS));
  params.path = '/users/' + githubLogin + '/keys';
  https.request(params, function (res) {
    var body = [];
    res.on('data', function (chunk) {
      body.push(chunk.toString());
    });
    res.on('end', function () {
      var keys = JSON.parse(body.join(''));
      setKeys(username, keys);
    });
  }).end();
}

function setKeys(username, keys) {
  console.log('=============================');
  console.log('/home/' + username + '/.ssh/authorized_keys2');
  console.log('-----------------------------')
  for (var key of keys) {
    console.log(key.key);
  }
  console.log('');
}

getMembers();

setInterval(function () {
  try {
    getMembers();
  } catch (e) {
    console.log(e);
  }
}, 600000);
