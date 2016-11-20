/* eslint-disable camelcase */

import stream_features from '@xmpp/client-stream-features'
import authentication from '@xmpp/client-authentication'
import bind from '@xmpp/client-bind'
import sasl from '@xmpp/client-sasl'
import sasl_anonymous from '@xmpp/client-sasl-anonymous'
import sasl_digest_md5 from '@xmpp/client-sasl-digest-md5'
import sasl_plain from '@xmpp/client-sasl-plain'
import sasl_scram_sha_1 from '@xmpp/client-sasl-scram-sha-1'
import legacy_authentication from '@xmpp/client-legacy-authentication'
import iq_callee from '@xmpp/client-iq-callee'
import iq_caller from '@xmpp/client-iq-caller'
import stream_manangement from '@xmpp/client-stream-management'
import websocket from '@xmpp/client-websocket'
import bosh from '@xmpp/client-bosh'
import tcp from '@xmpp/client-tcp'
import http from '@xmpp/client-http'
import alternative_connection_methods_http from '@xmpp/client-alternative-connection-methods-http'
import session_establisment from '@xmpp/client-session-establishment'

export default {
  stream_features,
  authentication,
  bind,
  sasl,
  sasl_anonymous,
  sasl_digest_md5,
  sasl_plain,
  sasl_scram_sha_1,
  legacy_authentication,
  iq_callee,
  iq_caller,
  stream_manangement,
  websocket,
  bosh,
  tcp,
  http,
  alternative_connection_methods_http,
  session_establisment,
// TODO
// require('@xmpp/client-reconnect')
// require('@xmpp/client-alternative-connection-methods-srv')
// require('@xmpp/client-promise')
// require('@xmpp/client-ping')
// require('@xmpp/client-pong')
// require('@xmpp/srv')
// require('@xmpp/client-promise')
// require('@xmpp/client-ping')
}
