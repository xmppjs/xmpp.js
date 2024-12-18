-- Prosody IM
-- Copyright (C) 2019 Kim Alvefur
--
-- This project is MIT/X11 licensed. Please see the
-- COPYING file in the source package for more information.
--
-- XEP-0388: Extensible SASL Profile
--

local st = require "util.stanza";
local errors = require "util.error";
local base64 = require "util.encodings".base64;
local jid_join = require "util.jid".join;
local set = require "util.set";

local usermanager_get_sasl_handler = require "core.usermanager".get_sasl_handler;
local sm_make_authenticated = require "core.sessionmanager".make_authenticated;

local xmlns_sasl2 = "urn:xmpp:sasl:2";

local secure_auth_only = module:get_option_boolean("c2s_require_encryption", module:get_option_boolean("require_encryption", true));
local allow_unencrypted_plain_auth = module:get_option_boolean("allow_unencrypted_plain_auth", false)
local insecure_mechanisms = module:get_option_set("insecure_sasl_mechanisms", allow_unencrypted_plain_auth and {} or {"PLAIN", "LOGIN"});
local disabled_mechanisms = module:get_option_set("disable_sasl_mechanisms", { "DIGEST-MD5" });

local host = module.host;

local function tls_unique(self)
	return self.userdata["tls-unique"]:ssl_peerfinished();
end

local function tls_exporter(conn)
	if not conn.ssl_exportkeyingmaterial then return end
	return conn:ssl_exportkeyingmaterial("EXPORTER-Channel-Binding", 32, "");
end

local function sasl_tls_exporter(self)
	return tls_exporter(self.userdata["tls-exporter"]);
end

module:hook("stream-features", function(event)
	local origin, features = event.origin, event.features;
	local log = origin.log or module._log;

	if origin.type ~= "c2s_unauthed" then
		log("debug", "Already authenticated");
		return
	elseif secure_auth_only and not origin.secure then
		log("debug", "Not offering authentication on insecure connection");
		return;
	end

	local sasl_handler = usermanager_get_sasl_handler(host, origin)
	origin.sasl_handler = sasl_handler;

	local channel_bindings = set.new()
	if origin.encrypted then
		-- check whether LuaSec has the nifty binding to the function needed for tls-unique
		-- FIXME: would be nice to have this check only once and not for every socket
		if sasl_handler.add_cb_handler then
			local info = origin.conn:ssl_info();
			if info and info.protocol == "TLSv1.3" then
				log("debug", "Channel binding 'tls-unique' undefined in context of TLS 1.3");
				if tls_exporter(origin.conn) then
					log("debug", "Channel binding 'tls-exporter' supported");
					sasl_handler:add_cb_handler("tls-exporter", sasl_tls_exporter);
					channel_bindings:add("tls-exporter");
				else
					log("debug", "Channel binding 'tls-exporter' not supported");
				end
			elseif origin.conn.ssl_peerfinished and origin.conn:ssl_peerfinished() then
				log("debug", "Channel binding 'tls-unique' supported");
				sasl_handler:add_cb_handler("tls-unique", tls_unique);
				channel_bindings:add("tls-unique");
			else
				log("debug", "Channel binding 'tls-unique' not supported (by LuaSec?)");
			end
			sasl_handler["userdata"] = {
				["tls-unique"] = origin.conn;
				["tls-exporter"] = origin.conn;
			};
		else
			log("debug", "Channel binding not supported by SASL handler");
		end
	end

	local mechanisms = st.stanza("authentication", { xmlns = xmlns_sasl2 });

	local available_mechanisms = sasl_handler:mechanisms()
	for mechanism in pairs(available_mechanisms) do
		if disabled_mechanisms:contains(mechanism) then
			log("debug", "Not offering disabled mechanism %s", mechanism);
		elseif not origin.secure and insecure_mechanisms:contains(mechanism) then
			log("debug", "Not offering mechanism %s on insecure connection", mechanism);
		else
			log("debug", "Offering mechanism %s", mechanism);
			mechanisms:text_tag("mechanism", mechanism);
		end
	end

	features:add_direct_child(mechanisms);

	local inline = st.stanza("inline");
	module:fire_event("advertise-sasl-features", { origin = origin, features = inline, stream = event.stream });
	mechanisms:add_direct_child(inline);
end, 1);

local function handle_status(session, status, ret, err_msg)
	local err = nil;
	if status == "error" then
		ret, err = nil, ret;
		if not errors.is_err(err) then
			err = errors.new({ condition = err, text = err_msg }, { session = session });
		end
	end

	return module:fire_event("sasl2/"..session.base_type.."/"..status, {
			session = session,
			message = ret;
			error = err;
			error_text = err_msg;
		});
end

module:hook("sasl2/c2s/failure", function (event)
	module:fire_event("authentication-failure", event);
	local session, condition, text = event.session, event.message, event.error_text;
	local failure = st.stanza("failure", { xmlns = xmlns_sasl2 })
		:tag(condition, { xmlns = "urn:ietf:params:xml:ns:xmpp-sasl" }):up();
	if text then
		failure:text_tag("text", text);
	end
	session.send(failure);
	return true;
end);

module:hook("sasl2/c2s/error", function (event)
	local session = event.session
	session.send(st.stanza("failure", { xmlns = xmlns_sasl2 })
		:tag(event.error and event.error.condition));
	return true;
end);

module:hook("sasl2/c2s/challenge", function (event)
	local session = event.session;
	session.send(st.stanza("challenge", { xmlns = xmlns_sasl2 })
		:text(base64.encode(event.message)));
	return true;
end);

module:hook("sasl2/c2s/success", function (event)
	local session = event.session
	local ok, err = sm_make_authenticated(session, session.sasl_handler.username);
	if not ok then
		handle_status(session, "failure", err);
		return true;
	end
	event.success = st.stanza("success", { xmlns = xmlns_sasl2 });
	if event.message then
		event.success:text_tag("additional-data", base64.encode(event.message));
	end
end, 1000);

module:hook("sasl2/c2s/success", function (event)
	local session = event.session
	event.success:text_tag("authorization-identifier", jid_join(session.username, session.host, session.resource));
	session.send(event.success);
end, -1000);

module:hook("sasl2/c2s/success", function (event)
	module:fire_event("authentication-success", event);
	local session = event.session;
	local features = st.stanza("stream:features");
	module:fire_event("stream-features", { origin = session, features = features });
	session.send(features);
end, -1500);

-- The gap here is to allow modules to do stuff to the stream after the stanza
-- is sent, but before we proceed with anything else. This is expected to be
-- a common pattern with SASL2, which allows atomic negotiation of a bunch of
-- stream features.
module:hook("sasl2/c2s/success", function (event) --luacheck: ignore 212/event
	event.session.sasl_handler = nil;
	return true;
end, -2000);

local function process_cdata(session, cdata)
	if cdata then
		cdata = base64.decode(cdata);
		if not cdata then
			return handle_status(session, "failure", "incorrect-encoding");
		end
	end
	return handle_status(session, session.sasl_handler:process(cdata));
end

module:hook_tag(xmlns_sasl2, "authenticate", function (session, auth)
	if secure_auth_only and not session.secure then
		return handle_status(session, "failure", "encryption-required");
	end
	local sasl_handler = session.sasl_handler;
	if not sasl_handler then
		sasl_handler = usermanager_get_sasl_handler(host, session);
		session.sasl_handler = sasl_handler;
	end
	local mechanism = assert(auth.attr.mechanism);
	if not sasl_handler:select(mechanism) then
		return handle_status(session, "failure", "invalid-mechanism");
	end
	local user_agent = auth:get_child("user-agent");
	if user_agent then
		session.client_id = user_agent.attr.id;
		sasl_handler.user_agent = {
			software = user_agent:get_child_text("software");
			device = user_agent:get_child_text("device");
		};
	end
	local initial = auth:get_child_text("initial-response");
	return process_cdata(session, initial);
end);

module:hook_tag(xmlns_sasl2, "response", function (session, response)
	local sasl_handler = session.sasl_handler;
	if not sasl_handler or not sasl_handler.selected then
		return handle_status(session, "failure", "invalid-mechanism");
	end
	return process_cdata(session, response:get_text());
end);
