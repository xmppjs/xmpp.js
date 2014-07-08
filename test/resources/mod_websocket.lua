-- Prosody IM
-- Copyright (C) 2012 Florian Zeitz
--
-- This project is MIT/X11 licensed. Please see the
-- COPYING file in the source package for more information.
--

module:set_global();

local add_filter = require "util.filters".add_filter;
local sha1 = require "util.hashes".sha1;
local base64 = require "util.encodings".base64.encode;
local softreq = require "util.dependencies".softreq;
local st = require "util.stanza";
local parse_xml = require "util.xml".parse;
local portmanager = require "core.portmanager";
local sm_destroy_session = sessionmanager.destroy_session;
local log = module._log;

local bit;
pcall(function() bit = require"bit"; end);
bit = bit or softreq"bit32"
if not bit then module:log("error", "No bit module found. Either LuaJIT 2, lua-bitop or Lua 5.2 is required"); end
local band = bit.band;
local bxor = bit.bxor;
local rshift = bit.rshift;

local t_concat = table.concat;
local s_byte = string.byte;
local s_char= string.char;

local consider_websocket_secure = module:get_option_boolean("consider_websocket_secure");
local cross_domain = module:get_option("cross_domain_websocket");
if cross_domain then
	if cross_domain == true then
		cross_domain = "*";
	elseif type(cross_domain) == "table" then
		cross_domain = t_concat(cross_domain, ", ");
	end
	if type(cross_domain) ~= "string" then
		cross_domain = nil;
	end
end

local xmlns_framing = "urn:ietf:params:xml:ns:xmpp-framing";
local xmlns_streams = "http://etherx.jabber.org/streams";
local xmlns_client = "jabber:client";
local stream_xmlns_attr = {xmlns='urn:ietf:params:xml:ns:xmpp-streams'};

module:depends("c2s")
local sessions = module:shared("c2s/sessions");
local c2s_listener = portmanager.get_service("c2s").listener;

-- Websocket helpers
local function parse_frame(frame)
	local result = {};
	local pos = 1;
	local length_bytes = 0;
	local tmp_byte;

	if #frame < 2 then return; end

	tmp_byte = s_byte(frame, pos);
	result.FIN = band(tmp_byte, 0x80) > 0;
	result.RSV1 = band(tmp_byte, 0x40) > 0;
	result.RSV2 = band(tmp_byte, 0x20) > 0;
	result.RSV3 = band(tmp_byte, 0x10) > 0;
	result.opcode = band(tmp_byte, 0x0F);

	pos = pos + 1;
	tmp_byte = s_byte(frame, pos);
	result.MASK = band(tmp_byte, 0x80) > 0;
	result.length = band(tmp_byte, 0x7F);

	if result.length == 126 then
		length_bytes = 2;
		result.length = 0;
	elseif result.length == 127 then
		length_bytes = 8;
		result.length = 0;
	end

	if #frame < (2 + length_bytes) then return; end

	for i = 1, length_bytes do
		pos = pos + 1;
		result.length = result.length * 256 + s_byte(frame, pos);
	end

	if #frame < (2 + length_bytes + (result.MASK and 4 or 0) + result.length) then return; end

	if result.MASK then
		local counter = 0;
		local data = {};
		local key = {s_byte(frame, pos+1), s_byte(frame, pos+2),
				s_byte(frame, pos+3), s_byte(frame, pos+4)}
		result.key = key;

		pos = pos + 5;
		for i = pos, pos + result.length - 1 do
			data[#data+1] = s_char(bxor(key[counter+1], s_byte(frame, i)));
			counter = (counter + 1) % 4;
		end
		result.data = t_concat(data, "");
	else
		result.data = frame:sub(pos + 1, pos + result.length);
	end

	return result, 2 + length_bytes + (result.MASK and 4 or 0) + result.length;
end

local function build_frame(desc)
	local length;
	local result = {};
	local data = desc.data or "";

	result[#result+1] = s_char(0x80 * (desc.FIN and 1 or 0) + desc.opcode);

	length = #data;
	if length <= 125 then -- 7-bit length
		result[#result+1] = s_char(length);
	elseif length <= 0xFFFF then -- 2-byte length
		result[#result+1] = s_char(126);
		result[#result+1] = s_char(rshift(length, 8)) .. s_char(length%0x100);
	else -- 8-byte length
		result[#result+1] = s_char(127);
		local length_bytes = {};
		for i = 8, 1, -1 do
			length_bytes[i] = s_char(length % 0x100);
			length = rshift(length, 8);
		end
		result[#result+1] = t_concat(length_bytes, "");
	end

	result[#result+1] = data;

	return t_concat(result, "");
end

--- Session methods
local function session_open_stream(session)
	local attr = {
		xmlns = xmlns_framing,
		version = "1.0",
		id = session.streamid or "",
		from = session.host
	};
	session.send(st.stanza("open", attr));
end

local function session_close(session, reason)
	local log = session.log or log;
	if session.conn then
		if session.notopen then
			session:open_stream();
		end
		if reason then -- nil == no err, initiated by us, false == initiated by client
			local stream_error = st.stanza("stream:error");
			if type(reason) == "string" then -- assume stream error
				stream_error:tag(reason, {xmlns = 'urn:ietf:params:xml:ns:xmpp-streams' });
			elseif type(reason) == "table" then
				if reason.condition then
					stream_error:tag(reason.condition, stream_xmlns_attr):up();
					if reason.text then
						stream_error:tag("text", stream_xmlns_attr):text(reason.text):up();
					end
					if reason.extra then
						stream_error:add_child(reason.extra);
					end
				elseif reason.name then -- a stanza
					stream_error = reason;
				end
			end
			log("debug", "Disconnecting client, <stream:error> is: %s", tostring(stream_error));
			session.send(stream_error);
		end

		session.send(st.stanza("close", { xmlns = xmlns_framing }));
		function session.send() return false; end

		local reason = (reason and (reason.name or reason.text or reason.condition)) or reason;
		session.log("debug", "c2s stream for %s closed: %s", session.full_jid or ("<"..session.ip..">"), reason or "session closed");

		-- Authenticated incoming stream may still be sending us stanzas, so wait for </stream:stream> from remote
		local conn = session.conn;
		if reason == nil and not session.notopen and session.type == "c2s" then
			-- Grace time to process data from authenticated cleanly-closed stream
			add_task(stream_close_timeout, function ()
				if not session.destroyed then
					session.log("warn", "Failed to receive a stream close response, closing connection anyway...");
					sm_destroy_session(session, reason);
					-- Sends close with code 1000 and message "Stream closed"
					local data = s_char(0x03) .. s_char(0xe8) .. "Stream closed";
					conn:write(build_frame({opcode = 0x8, FIN = true, data = data}));
					conn:close();
				end
			end);
		else
			sm_destroy_session(session, reason);
			-- Sends close with code 1000 and message "Stream closed"
			local data = s_char(0x03) .. s_char(0xe8) .. "Stream closed";
			conn:write(build_frame({opcode = 0x8, FIN = true, data = data}));
			conn:close();
		end
	end
end


--- Filter stuff
local function filter_open_close(data)
	if not data:find(xmlns_framing, 1, true) then return data; end

	local oc = parse_xml(data);
	if not oc then return data; end
	if oc.attr.xmlns ~= xmlns_framing then return data; end
	if oc.name == "close" then return "</stream:stream>"; end
	if oc.name == "open" then
		oc.name = "stream:stream";
		oc.attr.xmlns = nil;
		oc.attr["xmlns:stream"] = xmlns_streams;
		return oc:top_tag();
	end

	return data;
end
function handle_request(event, path)
	local request, response = event.request, event.response;
	local conn = response.conn;

	if not request.headers.sec_websocket_key then
		response.headers.content_type = "text/html";
		return [[<!DOCTYPE html><html><head><title>Websocket</title></head><body>
			<p>It works! Now point your WebSocket client to this URL to connect to Prosody.</p>
			</body></html>]];
	end

	local wants_xmpp = false;
	(request.headers.sec_websocket_protocol or ""):gsub("([^,]*),?", function (proto)
		if proto == "xmpp" then wants_xmpp = true; end
	end);

	if not wants_xmpp then
		return 501;
	end

	local function websocket_close(code, message)
		local data = s_char(rshift(code, 8)) .. s_char(code%0x100) .. message;
		conn:write(build_frame({opcode = 0x8, FIN = true, data = data}));
		conn:close();
	end

	local dataBuffer;
	local function handle_frame(frame)
		local opcode = frame.opcode;
		local length = frame.length;
		module:log("debug", "Websocket received: %s (%i bytes)", frame.data, #frame.data);

		-- Error cases
		if frame.RSV1 or frame.RSV2 or frame.RSV3 then -- Reserved bits non zero
			websocket_close(1002, "Reserved bits not zero");
			return false;
		end

		if opcode == 0x8 then
			if length == 1 then
				websocket_close(1002, "Close frame with payload, but too short for status code");
				return false;
			elseif length >= 2 then
				local status_code = s_byte(frame.data, 1) * 256 + s_byte(frame.data, 2)
				if status_code < 1000 then
					websocket_close(1002, "Closed with invalid status code");
					return false;
				elseif ((status_code > 1003 and status_code < 1007) or status_code > 1011) and status_code < 3000 then
					websocket_close(1002, "Closed with reserved status code");
					return false;
				end
			end
		end

		if opcode >= 0x8 then
			if length > 125 then -- Control frame with too much payload
				websocket_close(1002, "Payload too large");
				return false;
			end

			if not frame.FIN then -- Fragmented control frame
				websocket_close(1002, "Fragmented control frame");
				return false;
			end
		end

		if (opcode > 0x2 and opcode < 0x8) or (opcode > 0xA) then
			websocket_close(1002, "Reserved opcode");
			return false;
		end

		if opcode == 0x0 and not dataBuffer then
			websocket_close(1002, "Unexpected continuation frame");
			return false;
		end

		if (opcode == 0x1 or opcode == 0x2) and dataBuffer then
			websocket_close(1002, "Continuation frame expected");
			return false;
		end

		-- Valid cases
		if opcode == 0x0 then -- Continuation frame
			dataBuffer[#dataBuffer+1] = frame.data;
		elseif opcode == 0x1 then -- Text frame
			dataBuffer = {frame.data};
		elseif opcode == 0x2 then -- Binary frame
			websocket_close(1003, "Only text frames are supported");
			return;
		elseif opcode == 0x8 then -- Close request
			websocket_close(1000, "Goodbye");
			return;
		elseif opcode == 0x9 then -- Ping frame
			frame.opcode = 0xA;
			conn:write(build_frame(frame));
			return "";
		elseif opcode == 0xA then -- Pong frame
			module:log("warn", "Received unexpected pong frame: " .. tostring(frame.data));
			return "";
		else
			log("warn", "Received frame with unsupported opcode %i", opcode);
			return "";
		end

		if frame.FIN then
			local data = t_concat(dataBuffer, "");
			dataBuffer = nil;
			return data;
		end
		return "";
	end

	conn:setlistener(c2s_listener);
	c2s_listener.onconnect(conn);

	local session = sessions[conn];

	session.secure = consider_websocket_secure or session.secure;

	session.open_stream = session_open_stream;
	session.close = session_close;

	local frameBuffer = "";
	add_filter(session, "bytes/in", function(data)
		local cache = {};
		frameBuffer = frameBuffer .. data;
		local frame, length = parse_frame(frameBuffer);

		while frame do
			frameBuffer = frameBuffer:sub(length + 1);
			local result = handle_frame(frame);
			if not result then return; end
			cache[#cache+1] = filter_open_close(result);
			frame, length = parse_frame(frameBuffer);
		end
		return t_concat(cache, "");
	end);

	add_filter(session, "bytes/out", function(data)
		return build_frame({ FIN = true, opcode = 0x01, data = tostring(data)});
	end);

	add_filter(session, "stanzas/out", function(stanza)
		local attr = stanza.attr;
		attr.xmlns = attr.xmlns or xmlns_client;
		if stanza.name:find("^stream:") then
			attr["xmlns:stream"] = attr["xmlns:stream"] or xmlns_streams;
		end
		return stanza;
	end);

	response.status_code = 101;
	response.headers.upgrade = "websocket";
	response.headers.connection = "Upgrade";
	response.headers.sec_webSocket_accept = base64(sha1(request.headers.sec_websocket_key .. "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"));
	response.headers.sec_webSocket_protocol = "xmpp";
	response.headers.access_control_allow_origin = cross_domain;

	return "";
end

function module.add_host(module)
	module:depends("http");
	module:provides("http", {
		name = "websocket";
		default_path = "xmpp-websocket";
		route = {
			["GET"] = handle_request;
			["GET /"] = handle_request;
		};
	});
end
