-- This server configuration is insecure by design
-- DO NOT COPY BLINDLY
-- see https://prosody.im/doc/configure

local lfs = require "lfs";

modules_enabled = {
  "roster";
  "saslauth";
  "tls";
  "dialback";
  "disco";
  "ping";
  "register";
  "posix";
  "bosh";
  "websocket";
  "time";
  "version";
  "smacks";
};

modules_disabled = {
  "s2s";
}

daemonize = true;
pidfile = lfs.currentdir() .. "/prosody.pid";

allow_registration = true;

allow_unencrypted_plain_auth = true;
c2s_require_encryption = false;

consider_websocket_secure = true;
consider_bosh_secure = true;
cross_domain_bosh = true;
cross_domain_websocket = true;

authentication = "internal_plain"

c2s_direct_tls_ports = { 5223 };

log = {
  debug = lfs.currentdir() .. "/prosody.log";
  error = lfs.currentdir() .. "/prosody.err";
}

ssl = {
  certificate = lfs.currentdir() .. "/certs/localhost.crt";
  key = lfs.currentdir() .. "/certs/localhost.key";
}

data_path = lfs.currentdir()

VirtualHost "localhost"

Component "component.localhost"
  component_secret = "mysecretcomponentpassword"

VirtualHost "anon.localhost"
  authentication = "anonymous"
