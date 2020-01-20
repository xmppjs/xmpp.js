local lfs = require "lfs";

plugin_paths = { lfs.currentdir() .. "/prosody-modules" }

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

  -- prosody-modules
  "smacks";
  -- "smacks_offline";
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

legacy_ssl_ports = { 5223 };

log = {
  debug = lfs.currentdir() .. "/prosody.log";
  error = lfs.currentdir() .. "/prosody.err";
}

ssl = {
  certificate = lfs.currentdir() .. "/localhost.crt";
  key = lfs.currentdir() .. "/localhost.key";
}

data_path = lfs.currentdir()

VirtualHost "localhost"

Component "component.localhost"
  component_secret = "mysecretcomponentpassword"

VirtualHost "anon.localhost"
  authentication = "anonymous"
