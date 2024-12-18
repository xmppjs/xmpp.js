local st = require "util.stanza";

local mod_smacks = module:depends("smacks");

local xmlns_sasl2 = "urn:xmpp:sasl:2";
local xmlns_sm = "urn:xmpp:sm:3";

module:depends("sasl2");

-- Advertise what we can do

module:hook("advertise-sasl-features", function (event)
	local features = event.features;
	features:tag("sm", { xmlns = xmlns_sm }):up();
end);

module:hook("advertise-bind-features", function (event)
	local features = event.features;
	features:tag("feature", { var = xmlns_sm }):up();
end);

module:hook_tag(xmlns_sasl2, "authenticate", function (session, auth)
	-- Cache action for future processing (after auth success)
	session.sasl2_sm_request = auth:child_with_ns(xmlns_sm);
end, 100);

-- SASL 2 integration (for resume)

module:hook("sasl2/c2s/success", function (event)
	local session = event.session;
	local sm_request = session.sasl2_sm_request;
	if not sm_request then return; end
	session.sasl2_sm_request = nil;
	local sm_result;
	if sm_request.name ~= "resume" then return; end

	local resumed, err = mod_smacks.do_resume(session, sm_request);
	if not resumed then
		local h = err.context and err.context.h;
		sm_result = st.stanza("failed", { xmlns = xmlns_sm, h = h and ("%d"):format(h) or nil })
			:add_error(err);
	else
		event.session = resumed.session; -- Update to resumed session
		event.session.sasl2_sm_success = resumed; -- To be called after sending final SASL response
		sm_result = st.stanza("resumed", { xmlns = xmlns_sm,
			h = ("%d"):format(event.session.handled_stanza_count);
			previd = resumed.id; });
	end

	if sm_result then
		event.success:add_child(sm_result);
	end
end, 110);

-- Bind 2 integration (for enable)

module:hook("enable-bind-features", function (event)
	local sm_enable = event.request:get_child("enable", xmlns_sm);
	if not sm_enable then return; end

	local sm_result;
	local enabled, err = mod_smacks.do_enable(event.session, sm_enable);
	if not enabled then
		sm_result = st.stanza("failed", { xmlns = xmlns_sm })
			:add_error(err);
	else
		event.session.sasl2_sm_success = enabled; -- To be called after sending final SASL response
		sm_result = st.stanza("enabled", {
			xmlns = xmlns_sm;
			id = enabled.id;
			resume = enabled.id and "1" or nil;
			max = enabled.resume_max;
		});
	end
	event.result:add_child(sm_result);
end, 100);

-- Finish and/or clean up after SASL 2 completed

module:hook("sasl2/c2s/success", function (event)
	-- The authenticate response has already been sent at this point
	local success = event.session.sasl2_sm_success;
	if success then
		success.finish(); -- Finish enable/resume and sync stanzas
	end
end, -1100);

module:hook("sasl2/c2s/failure", function (event)
	event.session.sasl2_sm_request = nil;
end);
