
var sys = require("sys");
var horaa = require('horaa');
var ltx = require('ltx');

var nodemock = require("nodemock");
var xmpp = require("xmpp");

var vows = require('vows'),
assert = require('assert');

var C2S = require('xmpp/c2s').C2S;

var NS_JABBER_IQ_ROSTER = 'jabber:iq:roster';
var NS_XMPP_SASL = "urn:ietf:params:xml:ns:xmpp-sasl";
var NS_XMPP_BIND = "urn:ietf:params:xml:ns:xmpp-bind";
var NS_XMPP_SESSION = "urn:ietf:params:xml:ns:xmpp-session";
var NS_XMPP_STREAMS = "urn:ietf:params:xml:ns:xmpp-streams";
var NS_XMPP_STANZAS = "urn:ietf:params:xml:ns:xmpp-stanzas";

function sizeOf(obj) {

    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
	return size;
}

function xmlToObject( featuresStr ) {

	sys.puts( "server sent:");
	sys.puts( featuresStr );
	sys.puts( "\n\n");
	
    try {
        return ltx.parse(featuresStr);
    } catch (e) {
    	assert.isTrue( false );
    }
}

function streamFromClient(c2sClient, clientStream) {

	sys.puts( "server retrieved:");
	sys.puts( clientStream);
	sys.puts( "\n\n");
	
	c2sClient.onData(clientStream);
}

function c2sClientInitiatesStream(domain, client)
{
	var clientStream = "";
	clientStream += "<?xml version='1.0'?>";
	clientStream += "<stream:stream ";
	clientStream += "to='"+ domain + "' ";
	clientStream += "xmlns='jabber:client' ";
	clientStream += "xmlns:stream='http://etherx.jabber.org/streams' ";
	clientStream +=  "version='1.0' >";
	streamFromClient(client, clientStream);
}

function readFeatures( socket ) {

	// server send back a stream
	var pattern = "";
	pattern += '<stream:stream ';
	pattern += 'xmlns:stream="http://etherx.jabber.org/streams" ';
	pattern += 'xmlns="jabber:client" ';
	pattern += 'version="1.0" ';
	pattern += 'id="([a-zA-Z_0-9]*)" ';
	pattern += 'from="([a-zA-Z\.]*)"';
	pattern += '>(.*)';
	var regEx = new RegExp(pattern,'g');
	//sys.puts( 'pattern : ' + pattern );
	//sys.puts( 'stream : ' + socket.streamResult  );
	var strings = regEx.exec( socket.streamResult );
    socket.streamResult = '';
	//sys.puts( strings );
    assert.isNotNull( strings );
    var featuresStr = strings[3];
    return xmlToObject( featuresStr );
}

function readError( socket ) {
	
	// server send back a stream
	var pattern = "";
	pattern += '(.*)</stream:stream>';
	var regEx = new RegExp(pattern,'g');
	var strings = regEx.exec( socket.streamResult );
    socket.streamResult = '';
    assert.isNotNull( strings );
    var errorStr = strings[1];
    return xmlToObject( errorStr );
}


function encode64(decoded) {
    return (new Buffer(decoded, 'utf8')).toString('base64');
}

function getPlainAuth( params) {
    var decodedString = params.authzid + '\0' + params.authcid + '\0' + params.password;
    return encode64( decodedString );
}

function getPlainAuthByUserName( username ) {
    return getPlainAuth( {
		'authzid' : username + '@myharmony.com',
		'authcid' : username,
        'password' : '1234'
    } );
}

function clientSendEmptyAuth(client, mechanismType ) {

	var clientStream = "";
	clientStream += "<auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl'";
	clientStream += "  mechanism='"+mechanismType+"'/>";
	streamFromClient(client, clientStream);
}

function clientSendAuth(client, mechanismType, encodedResponse ) {
	var clientStream = "";
	clientStream += "<auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl'";
	clientStream += "  mechanism='"+mechanismType+"'>" + encodedResponse +"</auth>";
	streamFromClient(client, clientStream);
}

function clientSendResponse(client, encodedResponse ) {
	var clientStream = "";
	clientStream += "<response xmlns='urn:ietf:params:xml:ns:xmpp-sasl'";
	clientStream += " >" + encodedResponse +"</response>";
	streamFromClient(client, clientStream);
}

function clientSendAbort(client, encodedResponse ) {
	var clientStream = "";
	clientStream += "<abort xmlns='urn:ietf:params:xml:ns:xmpp-sasl'";
	clientStream += " >" + encodedResponse +"</abort>";
	streamFromClient(client, clientStream);
}

function verifyChallengeTag(socket, challenge)
{
	var challengeTag = xmlToObject( socket.streamResult );
	socket.streamResult = '';
	assert.equal (challengeTag.is('challenge', NS_XMPP_SASL), true );
	assert.equal (challengeTag.getText(), challenge );
}

function verifySuccessTag(socket ) {
    var success = xmlToObject( socket.streamResult );
    socket.streamResult = '';
    assert.equal ( success.is('success', NS_XMPP_SASL), true);
}

function verifyAuthError(socket, errortype)
{
    var failureTag = getError( socket );
    assert.equal (failureTag.is('failure', NS_XMPP_SASL), true );
    var message = failureTag.getChild(errortype, NS_XMPP_SASL);
    assert.equal ('<'+errortype+'/>',message.toString() );
}

function xmppAuthSucceed( domain, client, socket ) {
	// 6.5.9: Server informs client of successful authentication:
    verifySuccessTag(socket);

    /*
	// 6.5.10:  Client initiates a new stream to server
    c2sClientInitiatesStream( domain, client );
	// 6.5.11:  Server responds by sending a stream header to client :
	var features = readFeatures( socket );
    assert.equal ( true, features.is('features') );
    var bind = features.getChild('bind', NS_XMPP_BIND);
    assert.isNotNull ( bind );
    var session = features.getChild('bind', NS_XMPP_SESSION);
    assert.isNotNull ( session );*/
}


function clientSendIqBind(client, resourceId, iqtype) {

	if ( !iqtype ) {
		iqtype = 'set';
	}
	var clientStream = "";
	clientStream += "<iq type='"+iqtype+"' id='bind_1'>";
	clientStream += "<bind xmlns='"+NS_XMPP_BIND+"'>";
	clientStream += "<resource>"+resourceId+"</resource>";
	clientStream += "</bind>";
	clientStream += "</iq>";
	streamFromClient(client, clientStream);
}

function clientSendEmptyIqBind(client) {

	var clientStream = "";
	clientStream += "<iq type='set' id='bind_1'>";
	clientStream += "<bind xmlns='"+NS_XMPP_BIND+"'/>";
	clientStream += "</iq>";
	streamFromClient(client, clientStream);
}

function verifyIqBindResult(socket, userName, domain, resourceId, currentJid){
    var iqTag = xmlToObject( socket.streamResult );
    socket.streamResult = '';
    assert.equal ( iqTag.is('iq'), true);
    assert.equal ( iqTag.attrs['type'], 'result');
    var bindTag = iqTag.getChild('bind', NS_XMPP_BIND);
    var jidTag = bindTag.getChild('jid', NS_XMPP_BIND);
    var jid = new xmpp.JID( jidTag.getText() );
    assert.equal ( jid.user, userName);
    assert.equal ( jid.domain, domain);
    assert.equal ( jid.resource, resourceId );
    assert.equal ( currentJid.user, userName);
    assert.equal ( currentJid.domain, domain);
    assert.equal ( currentJid.resource, resourceId );
}

var api = {
		createC2S: function(domain){ 
			return function() {
				var port = 5222;
				var router_port = 5269;
				
				var mockedServerSocket = nodemock.mock("listen").takes( port );
				var mockedRouterServerSocket = nodemock.mock("listen").takes( router_port, "::" );

				var counter = 0;
				var response = null;
				var router_response = null;
				var httpsHoraa = horaa('net');
				httpsHoraa.hijack('createServer', function( cb ) {
					counter++;
					if ( counter == 1 ) {
						response = cb;
						return mockedServerSocket;
					} else {
						router_response = cb;
						return mockedRouterServerSocket;
					}
				} );

				
				var server = new C2S( { 'domain' : domain 
					, "port" : port
				} );
	
				return { 'server' : server, 'domain' : domain, 'acceptctrl' : response }; 
			};
		},
		createC2SClient: function(domain){ 
			return function(params) {
				
				var server = params.server;
				
				server.addListener( "connect", function( c2sclient ) {
					params.client = c2sclient;
				});
				// arrange
				//sys.puts(  server.clients );
				
				//sys.puts("createIncomingClient\n\n");
				var mockSocket = {};
				mockSocket.addListener = function( e, cb ){};
				mockSocket.writable = true;
				mockSocket.streamResult = '';
				mockSocket.setKeepAlive = function( a, b ){};
				mockSocket.write = function(data) { this.streamResult += data.toString();};
				mockSocket.end = function() {};
				assert.equal( sizeOf(server.sessions), 0 );
				// act
				params.acceptctrl(mockSocket);
				// assert
				assert.equal( sizeOf(server.sessions), 0 );
	
				params['socket'] = mockSocket;
				return params; 
			};
		},
		c2sServerStartStream : function(){ 
	        return function( params ){
				//sys.puts("serverStartStream\n\n");
	        	
	        	// 6.5.1  Client initiates stream to server:
				var client = params.client;
				var socket = params.socket;
				c2sClientInitiatesStream( params.server.options.domain, client );
				// 6.5.2 Server responds with a stream tag sent to client: 
				// and 6.5.3 Server informs client of available authentication mechanisms
				var features = readFeatures( socket );
	            assert.equal ( true, features.is('features') );
	            var mechanisms = features.getChild('mechanisms', NS_XMPP_SASL);
	            assert.isNotNull ( mechanisms);
	            var mechanismChildren = mechanisms.getChildren('mechanism', NS_XMPP_SASL);
	            assert.equal ("PLAIN", mechanismChildren[0].getText() );
	            return params;
			};
		},
		fastSASLNegotiation: function (userName) {
			return function( params ) {
				
				var client = params.client;
				var socket = params.socket;
				var domain = params.server.options.domain;
	    		params.server.addListener('authenticate', function ( jid, password, client, cb ) {
	    			cb(true);
	    		} );
	    		
				clientSendAuth(client, 'PLAIN', getPlainAuthByUserName(userName));

				
	    		// 6.5.9 - 6.5.11
	    		xmppAuthSucceed( domain, client, socket );
	    		params.userName = userName;
	    		
	    		return params;
			};
		},
		slowSASLNegotiation: function (userName) {
			return function( params ) {
				var client = params.client;
				var socket = params.socket;
				var domain = params.server.options.domain;
				
	    		params.server.addListener('authenticate', function ( jid, password, client, cb ) {
	    			cb(true);
	    		} );
	    		
	    		// 6.5.4
				clientSendEmptyAuth(client, 'PLAIN');
	    		// 6.5.5 Server sends a [BASE64] encoded challenge to client:
				verifyChallengeTag(socket, "");

	            // 6.5.6: Client sends a [BASE64] encoded response to the challenge:
	    		clientSendResponse( client, getPlainAuthByUserName(userName) );

	    		// 6.5.9 - 6.5.11
	    		xmppAuthSucceed( domain, client, socket );
	    		params.userName = userName;
	    		return params;
			};
		},
		bindUser: function (resourceId) {
			return function ( params ) {
				var client = params.client;
				var socket = params.socket;

				clientSendIqBind( client, resourceId );
				
				verifyIqBindResult(socket, params.userName, params.domain, resourceId, client.jid);
				return params;
			};
		}
};
//Create a Test Suite
vows.describe('C2S server ').addBatch({
	'a c2s server created': { 
	topic : api.createC2S('github.com') , 
		'c2s client connected': { 
		topic : api.createC2SClient( ) ,
		"c2s client close" : function( params ) {
			var server = params.server;
			var client = params.client;
			assert.isNotNull( client);
			client.emit( 'close', 'client error');
			
		}
	},
	'a c2s server created': { 
		topic : api.createC2S('github.com') , 
			'c2s client connected': { 
			topic : api.createC2SClient( ) ,
				"retrieve stream from client" : {
					topic : api.c2sServerStartStream(),
					"testing" : function( params )
					{
		
					}
				}
			}
	},
	'SASL negotiation (PLAIN) - shortcut': { 
		topic : api.createC2S('github.com') , 
		'c2s client connected': { 
			topic : api.createC2SClient( ) ,
			'client initiates a stream, and server responds with a stream tag sent to client along with auth features (6.5.1 to 6.5.3)': {
				topic: api.c2sServerStartStream(),
				"empty auth retrieved (correct encoding) , server sends encoded challenge":  api.fastSASLNegotiation()
			}
		}
	},
	'SASL negotiation (PLAIN)': { 
		topic : api.createC2S('github.com') , 
		'c2s client connected': { 
			topic : api.createC2SClient( ) ,
			'client initiates a stream, and server responds with a stream tag sent to client along with auth features (6.5.1 to 6.5.3)': {
				topic: api.c2sServerStartStream(),
				// TODO : c2s doesn't support slow sasl negotiation
				"empty auth retrieved (correct encoding) , server sends encoded challenge":  api.slowSASLNegotiation()
			}
		}
	}
}

	/*
	'a user goes online and offline': { 
		topic : api.createC2S('github.xom') , 
		'adding new client': { 
			topic : api.createC2SClient( ) ,
			"client has been auth and online" : {
				topic : api.jidOnline( 'hpychan', 'github.xom') ,
				"remove client" : function( params ) {
					var username = 'hpychan';
					var server = params.server;
					for (var streamId in server.clients) {
						var client = server.clients[streamId];
						client.emit( 'end', client);
						//server.on
						/*JidOffline( client );
					}
					assert.equal( server.getJids().length, 0 );
					// get jids with correct usernames
					assert.equal( server.getIncomingClients(username).length, 0 );
				}
				
			}
		}
	},
	'a server goes to prebind state with valid jid': { 
		topic : api.createC2S('github.xom') , fastSslowSASLNegotiationASLNegotiation
		'adding new client': { 
			topic : api.createC2SClient( ) ,
				"prebind for jid name" : function( params ) {
					var username = 'hpychan';
					var domain = 'github.xom';
					var server = params.server;
					for (var streamId in server.clients) {
						var client = server.clients[streamId];
						var jid = new xmpp.JID( username, domain );
						var prebind = { 'jid' : jid };
						
						client.emit( 'preBind', prebind);
						var pattern = 'generatedId-(0-9)*';
						var regEx = new RegExp(pattern,'g');
						assert.isTrue( regEx.test( prebind.resource ));
					}
				}
		}
	},
	'a server goes to prebind state without valid jid': { 
		topic : api.createC2S('github.xom') , 
		'adding new client': { 
			topic : api.createC2SClient( ) ,
				"prebind for jid name" : function( params ) {
					var username = 'hpychan';
					var domain = 'github.xom';
					var server = params.server;
					for (var streamId in server.clients) {
						var client = server.clients[streamId];
						var jid = new xmpp.JID( username, domain );
						var prebind = {};
						
						client.emit( 'preBind', prebind);
						
						assert.equal ( prebind.error, 'bad-request' );
					}
				}
		}
	},
	'a server has error after client connected': { 
		topic : api.createC2S('github.xom') , 
		'adding new client': { 
			topic : api.createC2SClient( ) ,
				"error happened" : function( params ) {
					var server = params.server;
					for (var streamId in server.clients) {
						var client = server.clients[streamId];
						
						client.emit( 'error', 'client error');
					}
				}
		}
	},
	'a server has error after client connected and sent a message': { 
		topic : api.createC2S('github.xom') , 
		'adding new client': { 
			topic : api.createC2SClient( ) ,
				"error happened after last message sent" : function( params ) {
					var server = params.server;
					for (var streamId in server.clients) {
						var client = server.clients[streamId];
						client.lastMessage = 'hello world';
						client.emit( 'error', 'client error');
					}
				}
		}
	},authe
	'a user goes online, server send a message to the user': { 
		topic : api.createC2S('github.xom') , 
		'adding new client': { 
			topic : api.createC2SClient( ) ,
			"client has been auth and online" : {
				topic : api.jidOnline( 'hpychan', 'github.xom') ,
				"send message to user" : {
					topic: function( params ) {
						var username = 'hpychan';
						var server = params.server;
						
						server.sendMessage( username, "hello", this.callback );
					},
					"callback from server" : function( statusCode, statusDescription) {
						assert.equal( statusCode, 200 );
						assert.equal( statusDescription, "OK" );
					}
				}
			}
		}
	},
	'server send a message to offline user': { 
		topic : api.createC2S('github.xom') , 
		"send message to user" : {
			topic: function( params ) {
				var username = 'hpychan';
				var server = params.server;
				
				server.sendMessage( username, "hello", this.callback );
			},
			"callback from server" : function( statusCode, statusDescription) {
				assert.equal( statusCode, 400 );
				assert.equal( statusDescription, "Not Found" );
			}
		}
	},
	'a user goes online, server send a iq message to the user': { 
		topic : api.createC2S('github.xom') , 
		'adding new client': { 
			topic : api.createC2SClient( ) ,
			"client has been auth and online" : {
				topic : api.jidOnline( 'hpychan', 'github.xom') ,
				"send iq message to user" : {

					topic: function( params ) {
						var username = 'hpychan';
						var server = params.server;

						server.sendIq( username, NS_JABBER_IQ_ROSTER, "query", {}, this.callback );
					},
					"callback from server" : function( params, statusCode, statusDescription, details) {
						assert.equal( statusCode, 400 );
						assert.equal( statusDescription, "Not Found" );
					}
				}
			}
		}
	},
	'server send a iq message to offline user': { 
		topic : api.createC2S('github.xom') , 
		"send iq message to offline user" : {
			topic: function( params ) {
				var username = 'hpychan';
				var server = params.server;

				server.sendIq( username, NS_JABBER_IQ_ROSTER, "query", {}, this.callback );
			},
			"callback from server" : function( params, statusCode, statusDescription, details) {
				assert.equal( statusCode, 400 );
				assert.equal( statusDescription, "Not Found" );
			}
		}
	}
	*/
}).export( module, {'error': false} );  // export to suite