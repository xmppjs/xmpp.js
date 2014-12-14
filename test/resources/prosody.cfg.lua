modules_enabled = {
		"roster";
		"saslauth";
		"tls";
		"dialback";
		"disco";
		"private"; 
		"vcard";
		"version";
		"uptime";
		"time";
		"ping";
		"pep";
		"register";
		"admin_adhoc"; 
		"posix";
        "bosh";
        "websocket";
};

allow_registration = true;
daemonize = true;
consider_websocket_secure = true;
consider_bosh_secure = true;
cross_domain_bosh = true;
pidfile = "/var/run/prosody/prosody.pid";

c2s_require_encryption = false

authentication = "internal_plain"

log = {
	-- Log files (change 'info' to 'debug' for debug logs):
	info = "/var/log/prosody/prosody.log";
	error = "/var/log/prosody/prosody.err";
	-- Syslog:
	{ levels = { "error" }; to = "syslog";  };
}

VirtualHost "localhost"
	enabled = true
    ssl = {
		key = "/etc/prosody/certs/example.com.key";
		certificate = "/etc/prosody/certs/example.com.crt";
	}

Component "component.localhost"
	component_secret = "mysecretcomponentpassword"
