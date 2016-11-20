import test from 'ava'
import {getHostname} from '../src'

test.skip('returns hostname for a given uri', t => {
  t.is(getHostname('https://xmpp.org:443/about/technology-overview.html'), 'xmpp.org')
})
