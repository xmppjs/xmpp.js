exports.attach = function(stream, rateLimit) {
    var timer;
    stream.rateLimit = rateLimit;  // makes it readjustable after attachment
    stream.addListener('data', function(data) {
			   if (timer !== undefined)
			       clearTimeout(timer);

			   stream.pause();
			   var sleep = Math.floor(data.length * 1000 / stream.rateLimit);
			   timer = setTimeout(function() {
			       timer = undefined;
			       stream.resume();
			   }, sleep);
		       });
};
