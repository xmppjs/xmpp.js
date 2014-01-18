'use strict';

var Client = require('../index')
  , ltx  = require('ltx')

var facebookId = '<< facebook user ID >>'
var appId = '<< appliction ID >> '
var appSecret = '<< application secret >>'
var accessToken = 'Get access token from here (make sure you select your app and check extended xmpp_login permission): https://developers.facebook.com/tools/explorer'

var client = new Client({
    jid: '-' + facebookId + '@chat.facebook.com',
    password: '3cQDAUtUg9fF$wP*cYjZfwy&q5Wa%S$tWnU2',
    api_key: appId,
    secret_key: appSecret,
    access_token: accessToken
})

client.addListener('online', function(data) {
    console.log('Connected as ' + data.jid.user + '@' + data.jid.domain + '/' + data.jid.resource)
    // nodejs has nothing left to do and will exit
    client.end()
})

client.addListener('error', function(e) {
    console.error(e)
    process.exit(1)
})
