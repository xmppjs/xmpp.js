plugin_paths = { "./prosody-modules" }

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
pidfile = "prosody.pid";

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
  debug = "prosody.log";
  error = "prosody.err";
}

ssl = {
  certificate = "localhost.crt";
  key = "localhost.key";
}

data_path = "."

VirtualHost "localhost"

Component "component.localhost"
  component_secret = "mysecretcomponentpassword"

VirtualHost "anon.localhost"
  authentication = "anonymous"
