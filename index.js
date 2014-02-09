module.exports = {
    // S2S
    Router: require('./lib/s2s/router'),

    // C2S
    C2SServer: require('./lib/c2s/server'),
    C2SStream: require('./lib/c2s/stream'),

    // BOSH
    BOSHServer: require('./lib/bosh/server'),

    // SASL
    auth: {
        Plain: require('./lib/authentication/plain'),
        DigestMD5: require('./lib/authentication/digestmd5'),
        XOAuth2: require('./lib/authentication/xoauth2'),
        Anonymous: require('./lib/authentication/anonymous')
    }
}
