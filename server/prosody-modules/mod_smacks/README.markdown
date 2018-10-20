---
labels:
- 'Stage-Alpha'
summary: 'XEP-0198: Reliability and fast reconnects for XMPP'
...

Introduction
============

By default XMPP is as reliable as your network is. Unfortunately in some
cases that is not very reliable - in some network conditions disconnects
can be frequent and message loss can occur.

To overcome this, XMPP has an optional extension (XEP-0198: Stream
Management) which, when supported by both the client and server, can
allow a client to resume a disconnected session, and prevent message
loss.

Details
=======

When using XEP-0198 both the client and the server keep a queue of the
most recently sent stanzas - this is cleared when the other end
acknowledges they have received the stanzas. If the client disconnects,
instead of marking the user offline the server pretends the client is
still online for a short (configurable) period of time. If the client
reconnects within this period, any stanzas in the queue that the client
did not receive are re-sent.

If the client fails to reconnect before the timeout then it is marked
offline as normal, and any stanzas in the queue are returned to the
sender as a "recipient-unavailable" error.

If you don't want this behaviour on timeout you can use [mod_smacks_offline]
or [mod_smacks_noerror] to customize the behaviour further.

This module also provides some events used by [mod_cloud_notify].
These events are: "smacks-ack-delayed", "smacks-hibernation-start" and
"smacks-hibernation-end". See [mod_cloud_notify] for details on how this
events are used there.

Use prosody 0.10+ to have per user limits on allowed sessions in hibernation
state and allowed sessions for which the h-value is kept even after the
hibernation timed out.
These are settable using `smacks_max_hibernated_sessions` and `smacks_max_old_sessions`.

Configuration
=============

  Option                              Default           Description
  ----------------------------------  ----------------- ------------------------------------------------------------------------------------------------------------------
  `smacks_hibernation_time`           300 (5 minutes)   The number of seconds a disconnected session should stay alive for (to allow reconnect)
  `smacks_enabled_s2s`                false             Enable Stream Management on server connections? *Experimental*
  `smacks_max_unacked_stanzas`        0                 How many stanzas to send before requesting acknowledgement
  `smacks_max_ack_delay`              60 (1 minute)     The number of seconds an ack must be unanswered to trigger an "smacks-ack-delayed" event
  `smacks_max_hibernated_sessions`    10                The number of allowed sessions in hibernated state (limited per user)
  `smacks_max_old_sessions`           10                The number of allowed sessions with timed out hibernation for which the h-value is still kept (limited per user)

Compatibility
=============

  ----- -----------------------------------------------------------------------------
  0.10  Works
  0.9   Works, no per user limit of hibernated sessions
  0.8   Works, no per user limit of hibernated sessions, use version [7693724881b3]
  ----- -----------------------------------------------------------------------------


Clients
=======

Clients that support [XEP-0198]:

-   Gajim (Linux, Windows, OS X)
-   Conversations (Android)
-   ChatSecure (iOS)
-   Swift (but not resumption, as of version 2.0 and alphas of 3.0)
-   Psi (in an unreleased branch)
-   Yaxim (Android)
-   Monal (iOS)

[7693724881b3]: //hg.prosody.im/prosody-modules/raw-file/7693724881b3/mod_smacks/mod_smacks.lua
[mod_smacks_offline]: //modules.prosody.im/mod_smacks_offline
[mod_smacks_noerror]: //modules.prosody.im/mod_smacks_noerror
[mod_cloud_notify]: //modules.prosody.im/mod_cloud_notify
