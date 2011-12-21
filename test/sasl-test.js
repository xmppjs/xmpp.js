var vows = require('vows'),
assert = require('assert'),
sasl = require('./../lib/xmpp/sasl');

vows.describe('SASL').addBatch({

    'SCRAM-SHA-1': {
	'RFC 5802 example':
	function() {
	    var mech = sasl.selectMechanism("SCRAM-SHA-1");
	    mech.authcid = "user";
	    mech.password = "pencil";

	    assert.equal(mech.name, "SCRAM-SHA-1");
	    var clientFirstMessage = mech.auth();
	    assert.ok(/^n,,n=user,r=/.test(clientFirstMessage));

	    /* Attention: we ignore our implementation's r= value but
	     * pass the example one
	     */
	    mech.clientFirstMessageBare = "n=user,r=fyko+d2lbbFgONRv9qkxdawL";
	    var serverFirstMessage = "r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,s=QSXCR+Q6sek8bf92,i=4096";
	    var clientFinalMessage = mech.challenge(serverFirstMessage);
	    console.log("clientFinalMessage", clientFinalMessage);
	    assert.ok(/c=biws/.test(clientFinalMessage));
	    assert.ok(/r=fyko\+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j/.test(clientFinalMessage));
	    assert.ok(/p=v0X8v3Bz2T0CJGbJQyF0X+HI4Ts=/.test(clientFinalMessage));
	}
    }

}).export(module);
