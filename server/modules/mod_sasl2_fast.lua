local usermanager = require "core.usermanager";

local sasl = require "util.sasl";
local dt = require "util.datetime";
local id = require "util.id";
local jid = require "util.jid";
local st = require "util.stanza";
local now = require "util.time".now;
local hash = require "util.hashes";

local sasl_mt = getmetatable(sasl.new("", { mechanisms = {} }));
local function is_util_sasl(sasl_handler)
	return getmetatable(sasl_handler) == sasl_mt;
end

module:depends("sasl2");

-- Tokens expire after 21 days by default
local fast_token_ttl = module:get_option_number("sasl2_fast_token_ttl", 86400*21);
-- Tokens are automatically rotated daily
local fast_token_min_ttl = module:get_option_number("sasl2_fast_token_min_ttl", 86400);

local xmlns_fast = "urn:xmpp:fast:0";
local xmlns_sasl2 = "urn:xmpp:sasl:2";

local token_store = module:open_store("fast_tokens", "map");

local log = module._log;

local function make_token(username, client_id, mechanism)
	local new_token = "secret-token:fast-"..id.long();
	local key = hash.sha256(client_id, true).."-new";
	local issued_at = now();
	local token_info = {
		mechanism = mechanism;
		secret = new_token;
		issued_at = issued_at;
		expires_at = issued_at + fast_token_ttl;
	};
	if not token_store:set(username, key, token_info) then
		return nil;
	end
	return token_info;
end

local function new_token_tester(hmac_f)
	return function (mechanism, username, client_id, token_hash, cb_data, invalidate)
		local account_info = usermanager.get_account_info(username, module.host);
		local last_password_change = account_info and account_info.password_updated;
		local tried_current_token = false;
		local key = hash.sha256(client_id, true).."-new";
		local token;
		repeat
			log("debug", "Looking for %s token %s/%s", mechanism, username, key);
			token = token_store:get(username, key);
			if token and token.mechanism == mechanism then
				local expected_hash = hmac_f(token.secret, "Initiator"..(cb_data or ""));
				if hash.equals(expected_hash, token_hash) then
					local current_time = now();
					if token.expires_at < current_time then
						log("debug", "Token found, but it has expired (%ds ago). Cleaning up...", current_time - token.expires_at);
						token_store:set(username, key, nil);
						return nil, "credentials-expired";
					elseif last_password_change and token.issued_at < last_password_change then
						log("debug", "Token found, but issued prior to password change (%ds ago). Cleaning up...",
							current_time - last_password_change
						);
						token_store:set(username, key, nil);
						return nil, "credentials-expired";
					end
					if not tried_current_token and not invalidate then
						-- The new token is becoming the current token
						token_store:set_keys(username, {
							[key] = token_store.remove;
							[key:sub(1, -5).."-cur"] = token;
						});
					end
					local rotation_needed;
					if invalidate then
						token_store:set(username, key, nil);
					elseif current_time - token.issued_at > fast_token_min_ttl then
						log("debug", "FAST token due for rotation (age: %d)", current_time - token.issued_at);
						rotation_needed = true;
					end
					return true, username, hmac_f(token.secret, "Responder"..(cb_data or "")), rotation_needed;
				end
			end
			if not tried_current_token then
				log("debug", "Trying next token...");
				-- Try again with the current token instead
				tried_current_token = true;
				key = key:sub(1, -5).."-cur";
			else
				log("debug", "No matching %s token found for %s/%s", mechanism, username, key);
				return nil;
			end
		until false;
	end
end

function get_sasl_handler()
	local token_auth_profile = {
		ht_sha_256 = new_token_tester(hash.hmac_sha256);
	};
	local handler = sasl.new(module.host, token_auth_profile);
	handler.fast = true;
	return handler;
end

-- Advertise FAST to connecting clients
module:hook("advertise-sasl-features", function (event)
	local session = event.origin;
	local username = session.username;
	if not username then
		username = jid.node(event.stream.from);
		if not username then return; end
	end
	local sasl_handler = get_sasl_handler(username);
	if not sasl_handler then return; end
	sasl_handler.fast_auth = true; -- For informational purposes
	-- Copy channel binding info from primary SASL handler if it's compatible
	if is_util_sasl(session.sasl_handler) then
		sasl_handler.profile.cb = session.sasl_handler.profile.cb;
		sasl_handler.userdata = session.sasl_handler.userdata;
	end
	-- Store this handler, in case we later want to use it for authenticating
	session.fast_sasl_handler = sasl_handler;
	local fast = st.stanza("fast", { xmlns = xmlns_fast });
	for mech in pairs(sasl_handler:mechanisms()) do
		fast:text_tag("mechanism", mech);
	end
	event.features:add_child(fast);
end);

-- Process any FAST elements in <authenticate/>
module:hook_tag(xmlns_sasl2, "authenticate", function (session, auth)
	-- Cache action for future processing (after auth success)
	local fast_auth = auth:get_child("fast", xmlns_fast);
	if fast_auth then
		-- Client says it is using FAST auth, so set our SASL handler
		local fast_sasl_handler = session.fast_sasl_handler;
		local client_id = auth:get_child_attr("user-agent", nil, "id");
		if fast_sasl_handler and client_id then
			session.log("debug", "Client is authenticating using FAST");
			fast_sasl_handler.client_id = client_id;
			fast_sasl_handler.profile.cb = session.sasl_handler.profile.cb;
			fast_sasl_handler.userdata = session.sasl_handler.userdata;
			local invalidate = fast_auth.attr.invalidate;
			fast_sasl_handler.invalidate = invalidate == "1" or invalidate == "true";
			-- Set our SASL handler as the session's SASL handler
			session.sasl_handler = fast_sasl_handler;
		else
			session.log("warn", "Client asked to auth via FAST, but SASL handler or client id missing");
			local failure = st.stanza("failure", { xmlns = xmlns_sasl2 })
				:tag("malformed-request"):up()
				:text_tag("text", "FAST is not available on this stream");
			session.send(failure);
			return true;
		end
	end
	session.fast_sasl_handler = nil;
	local fast_token_request = auth:get_child("request-token", xmlns_fast);
	if fast_token_request then
		local mech = fast_token_request.attr.mechanism;
		session.log("debug", "Client requested new FAST token for %s", mech);
		session.fast_token_request = {
			mechanism = mech;
		};
	end
end, 100);

-- Process post-success (new token generation, etc.)
module:hook("sasl2/c2s/success", function (event)
	local session = event.session;

	local token_request = session.fast_token_request;
	local client_id = session.client_id;
	local sasl_handler = session.sasl_handler;
	if token_request or (sasl_handler.fast and sasl_handler.rotation_needed) then
		if not client_id then
			session.log("warn", "FAST token requested, but missing client id");
			return;
		end
		local mechanism = token_request and token_request.mechanism or session.sasl_handler.selected;
		local token_info = make_token(session.username, client_id, mechanism)
		if token_info then
			session.log("debug", "Provided new FAST token to client");
			event.success:tag("token", {
				xmlns = xmlns_fast;
				expiry = dt.datetime(token_info.expires_at);
				token = token_info.secret;
			}):up();
		end
	end
end, 75);

-- HT-* mechanisms

local function new_ht_mechanism(mechanism_name, backend_profile_name, cb_name)
	return function (sasl_handler, message)
		local backend = sasl_handler.profile[backend_profile_name];
		local authc_username, token_hash = message:match("^([^%z]+)%z(.+)$");
		if not authc_username then
			return "failure", "malformed-request";
		end
		local cb_data;
		if cb_name then
			if not sasl_handler.profile.cb then
				module:log("warn", "Attempt to use channel binding %s with SASL profile that does not support any channel binding (FAST: %s)", cb_name, sasl_handler.fast);
				return "failure", "malformed-request";
			elseif not sasl_handler.profile.cb[cb_name] then
				module:log("warn", "SASL profile does not support %s channel binding (FAST: %s)", cb_name, sasl_handler.fast);
				return "failure", "malformed-request";
			end
			cb_data = sasl_handler.profile.cb[cb_name](sasl_handler) or "";
		end
		local ok, authz_username, response, rotation_needed = backend(
			mechanism_name,
			authc_username,
			sasl_handler.client_id,
			token_hash,
			cb_data,
			sasl_handler.invalidate
		);
		if not ok then
			-- authz_username is error condition
			return "failure", authz_username or "not-authorized";
		end
		sasl_handler.username = authz_username;
		sasl_handler.rotation_needed = rotation_needed;
		return "success", response;
	end
end

local function register_ht_mechanism(name, backend_profile_name, cb_name)
	return sasl.registerMechanism(name, { backend_profile_name }, new_ht_mechanism(
		name,
		backend_profile_name,
		cb_name
	),
	cb_name and { cb_name } or nil);
end

register_ht_mechanism("HT-SHA-256-NONE", "ht_sha_256", nil);
register_ht_mechanism("HT-SHA-256-UNIQ", "ht_sha_256", "tls-unique");
register_ht_mechanism("HT-SHA-256-ENDP", "ht_sha_256", "tls-server-end-point");
register_ht_mechanism("HT-SHA-256-EXPR", "ht_sha_256", "tls-exporter");

-- Public API

--luacheck: ignore 131
function is_client_fast(username, client_id, last_password_change)
	local client_id_hash = hash.sha256(client_id, true);
	local curr_time = now();
	local cur = token_store:get(username, client_id_hash.."-cur");
	if cur and cur.expires_at >= curr_time and (not last_password_change or last_password_change < cur.issued_at) then
		return true;
	end
	local new = token_store:get(username, client_id_hash.."-new");
	if new and new.expires_at >= curr_time and (not last_password_change or last_password_change < new.issued_at) then
		return true;
	end
	return false;
end

function revoke_fast_tokens(username, client_id)
	local client_id_hash = hash.sha256(client_id, true);
	local cur_ok = token_store:set(username, client_id_hash.."-cur", nil);
	local new_ok = token_store:set(username, client_id_hash.."-new", nil);
	return cur_ok and new_ok;
end
