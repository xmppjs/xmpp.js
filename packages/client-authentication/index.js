function authenticate (client, creds, features) {
  const auth = client.authenticators.find(auth => auth.match(features, client))

  if (!auth) return Promise.reject(new Error('no compatible authentication'))

  return auth.authenticate(client, creds, features)
}

function addAuthenticator (client, mech) {
  client.authenticators.push(mech)
}

function plugin (client) {
  client.authenticators = []
  if (client.registerStreamFeature) {
    client.registerStreamFeature(streamFeature)
  }
}

function match (features, client) {
  return client.authenticators.some(auth => auth.match(features))
}

const streamFeature = {
  priority: 2500,
  match,
  restart: true,
  run: (client, features) => {
    return new Promise((resolve, reject) => {
      function auth (username, password) {
        return authenticate(client, {username, password}, features)
          .then(resolve)
          .catch(reject)
      }

      if (client.options.username && client.options.password) {
        auth(client.options.username, client.options.password)
      } else {
        client.emit('authenticate', auth)
      }
    })

  }
}

module.exports = {
  authenticate,
  addAuthenticator,
  plugin,
  streamFeature
}
