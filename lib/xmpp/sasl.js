function selectMechanism(mechs) {
    if (mechs.indexOf("ANONYMOUS") >= 0)
	return new Anonymous();
    /*if (mechs.indexOf("DIGEST-MD5") >= 0)
       return "DIGEST-MD5";*/
    else if (mechs.indexOf("PLAIN") >= 0)
       return new Plain();
    else
       return null;
}
exports.selectMechanism = selectMechanism;

function Plain() {
    this.name = "PLAIN";
    this.auth = function() {
	return this.authzid + "\0" +
	    this.authcid + "\0" +
	    this.password;
    };
}

function Anonymous() {
    this.name = "ANONYMOUS";
    this.auth = function() {
	return this.authzid;
    };
}
