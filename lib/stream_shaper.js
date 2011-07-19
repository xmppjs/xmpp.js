/**
 * This is extremely simple and unprecise.
 *
 * @param {Number} rateLimit B/ms or KB/s
 */
exports.attach = function(stream, rateLimit) {
    var timer;
    stream.rateLimit = rateLimit;  // makes it readjustable after attachment
    stream.addListener('data', function(data) {
                           if (timer)
                               clearTimeout(timer);

                           stream.pause();
                           var sleep = Math.floor(data.length / stream.rateLimit);
                           timer = setTimeout(function() {
                               timer = undefined;
                               stream.resume();
                           }, sleep);
                       });
    stream.addListener('close', function() {
        // don't let the last timeout inhibit node shutdown
        if (timer)
            clearTimeout(timer);
    });
};
