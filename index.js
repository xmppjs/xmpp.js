module.exports = {
    Router: require('./lib/router'),
    Server: require('./lib/server'),
    BOSHServer: require('./lib/bosh/bosh_server'),
    C2SServer: require('./lib/c2s/server'),
    C2SStream: require('./lib/c2s/stream'),

    auth: {
        Plain: require('./lib/authentication/plain'),
        DigestMD5: require('./lib/authentication/digestmd5'),
        XOAuth2: require('./lib/authentication/xoauth2')
    }
}
