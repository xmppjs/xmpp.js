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
};

daemonize = true;
pidfile = "/var/run/prosody/prosody.pid";

allow_registration = true;

consider_websocket_secure = true;
consider_bosh_secure = true;
cross_domain_bosh = true;
cross_domain_websocket = true;

authentication = "internal_plain"

legacy_ssl_ports = { 5223 };

log = {
  debug = "/var/log/prosody/prosody.log";
  error = "/var/log/prosody/prosody.err";
}

ssl = {
  certificate = "/var/lib/prosody/localhost.crt";
  key = "/var/lib/prosody/localhost.key";
}

VirtualHost "localhost"
Component "component.localhost"
  component_secret = "mysecretcomponentpassword"

VirtualHost "anon.localhost"
  authentication = "anonymous"
