/* References
 *  - In-Band Registration https://xmpp.org/extensions/xep-0077.html
 *  - prosody mod_register https://prosody.im/doc/modules/mod_register
 */

export const NS = 'jabber:iq:register'
export const NS_FEATURE = 'http://jabber.org/features/iq-register'
export const NS_DISCO_INFO = 'http://jabber.org/protocol/disco#info'

export function register (client, creds, cb) {
  return client.request((
    <iq type='set'>
      <query xmlns={NS}>
        <username>{creds.username}</username>
        <password>{creds.password}</password>
      </query>
    </iq>
  ), cb)
}

export function isSupported (element) {
  if (element.is('stream:features')) {
    return !!element.getChild('register', NS_FEATURE)
  }

  const query = element.getChild('query', NS_DISCO_INFO)
  return element.is('iq') && query && query.getChild('register', NS)
}

export function registerClient (...args) {
  register(this, ...args)
}

export function plugin (client) {
  client.register = registerClient
}

export default plugin
