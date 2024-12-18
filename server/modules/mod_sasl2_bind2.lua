local base64 = require "util.encodings".base64;
local id = require "util.id";
local sha1 = require "util.hashes".sha1;
local st = require "util.stanza";

local sm_bind_resource = require "core.sessionmanager".bind_resource;

local xmlns_bind2 = "urn:xmpp:bind:0";
local xmlns_sasl2 = "urn:xmpp:sasl:2";

module:depends("sasl2");

-- Advertise what we can do

module:hook("advertise-sasl-features", function(event)
	local bind = st.stanza("bind", { xmlns = xmlns_bind2 });
	local inline = st.stanza("inline");
	module:fire_event("advertise-bind-features", { origin = event.origin, features = inline });
	bind:add_direct_child(inline);

	event.features:add_direct_child(bind);
end, 1);

-- Helper to actually bind a resource to a session

local function do_bind(session, bind_request)
	local resource = session.sasl_handler.resource;

	if not resource then
		local client_name_tag = bind_request:get_child_text("tag");
		if client_name_tag then
			local client_id = session.client_id;
			local tag_suffix = client_id and base64.encode(sha1(client_id):sub(1, 9)) or id.medium();
			resource = ("%s~%s"):format(client_name_tag, tag_suffix);
		end
	end

	local success, err_type, err, err_msg = sm_bind_resource(session, resource);
	if not success then
		session.log("debug", "Resource bind failed: %s", err_msg or err);
		return nil, { type = err_type, condition = err, text = err_msg };
	end

	session.log("debug", "Resource bound: %s", session.full_jid);
	return st.stanza("bound", { xmlns = xmlns_bind2 });
end

-- Enable inline features requested by the client

local function enable_features(session, bind_request, bind_result)
	module:fire_event("enable-bind-features", {
		session = session;
		request = bind_request;
		result = bind_result;
	});
end

-- SASL 2 integration

module:hook_tag(xmlns_sasl2, "authenticate", function (session, auth)
	-- Cache action for future processing (after auth success)
	session.sasl2_bind_request = auth:child_with_ns(xmlns_bind2);
end, 100);

module:hook("sasl2/c2s/success", function (event)
	local session = event.session;

	local bind_request = session.sasl2_bind_request;
	if not bind_request then return; end -- No bind requested
	session.sasl2_bind_request = nil;

	local sm_success = session.sasl2_sm_success;
	if sm_success and sm_success.type == "resumed" then
		return; -- No need to bind a resource
	end

	local bind_result, err = do_bind(session, bind_request);
	if not bind_result then
		bind_result = st.stanza("failed", { xmlns = xmlns_bind2 })
			:add_error(err);
	else
		enable_features(session, bind_request, bind_result);
	end

	event.success:add_child(bind_result);
end, 100);

-- Inline features

module:hook("advertise-bind-features", function (event)
	local features = event.features;
	features:tag("feature", { var = "urn:xmpp:carbons:2" }):up();
	features:tag("feature", { var = "urn:xmpp:csi:0" }):up();
end);

module:hook("enable-bind-features", function (event)
	local session, request = event.session, event.request;

	-- Carbons
	if request:get_child("enable", "urn:xmpp:carbons:2") then
		session.want_carbons = true;
		event.result:tag("enabled", { xmlns = "urn:xmpp:carbons:2" }):up();
	end

	-- CSI
	local csi_state_tag = request:child_with_ns("urn:xmpp:csi:0");
	if csi_state_tag then
		session.state = csi_state_tag.name;
	end
end, 10);
