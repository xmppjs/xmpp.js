function Mechanism(name) {
    this.name = name;
    if (name == "PLAIN")
	Plain.call(this);
    else
	throw("Unsupported mechanism: " + name);
}
exports.Mechanism = Mechanism;

function Plain() {
    this.auth = function() {
	return this.authzid + "\0" +
	    this.authcid + "\0" +
	    this.password;
    };
}
