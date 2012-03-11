try

  StringPrep  = require("node-stringprep").StringPrep
  toUnicode   = require("node-stringprep").toUnicode

  c = (n) ->
    p = new StringPrep n
    (s) -> p.prepare s

  nameprep      = c "nameprep"
  nodeprep      = c "nodeprep"
  resourceprep  = c "resourceprep"

catch ex
  console.warn "Cannot load StringPrep-0.1.0 bindings. You may need to `npm install node-stringprep'"

  identity      = (a) -> a
  toUnicode     = identity
  nameprep      = identity
  nodeprep      = identity
  resourceprep  = identity

class JID

  constructor: (a, b, c) ->
    if a and not b? and not c?
      @parseJID a
    else if b
      @setUser a
      @setDomain b
      @setResource c
    else
      throw new Error("Argument error")

  parseJID: (s) ->
    if s.indexOf("@") >= 0
      @setUser s.substr 0, s.indexOf("@")
      s = s.substr s.indexOf("@") + 1
    if s.indexOf("/") >= 0
      @setResource s.substr s.indexOf("/") + 1
      s = s.substr 0, s.indexOf("/")
    @setDomain s

  toString: ->
    s = @domain
    s = "#{@user}@#{s}"     if @user
    s = "#{s}/#{@resource}" if @resource
    s

  bare: ->
    if @resource
      new JID(@user, @domain, null)
    else
      @

  equals: (other) ->
    @user is other.user and @domain is other.domain and @resource is other.resource

  setUser: (user) ->
    @user = user and nodeprep(user)

  setDomain: (domain) ->
    @domain = domain and nameprep(domain.split(".").map(toUnicode).join("."))

  setResource: (resource) ->
    @resource = resource and resourceprep(resource)

if exports?
  exports.JID = JID
else if window?
  window.JID = JID
