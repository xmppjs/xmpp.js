/**
 * Emulates stream.setTimeout() behaviour, but respects outgoing data
 * too.
 *
 * @param {Number} timeout Milliseconds
 */
exports.attach = function(stream, timeout) {
    var timer;
    var emitTimeout = function() {
        timer = undefined;
        stream.emit('timeout');
    };
    var updateTimer = function() {
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(emitTimeout, timeout);
    };
    
    var oldWrite = stream.write;
    stream.write = function() {
        updateTimer();
        oldWrite.apply(this, arguments);
    };
    var cleanup = function() {
    	if (timer)
    		clearTimeout(timer);
    	if ( oldWrite != stream.write) {
        	oldWrite = stream.write;
    	}
    };
    stream.addListener('data', updateTimer);
    stream.addListener('close', cleanup);
    stream.addListener('end', cleanup);
};
