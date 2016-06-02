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

log = {
  debug = "/var/log/prosody/prosody.log";
  error = "/var/log/prosody/prosody.err";
}

VirtualHost "localhost"
  ssl = {
    certificate = "/var/lib/prosody/localhost.crt";
    key = "/var/lib/prosody/localhost.key";
  }

Component "component.localhost"
  component_secret = "mysecretcomponentpassword"

VirtualHost "anon.localhost"
  authentication = "anonymous"
  ssl = {
    certificate = "/var/lib/prosody/localhost.crt";
    key = "/var/lib/prosody/localhost.key";
  }
