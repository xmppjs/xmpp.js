export default function route() {
  return async ({ stanza, entity }, next) => {
    if (!stanza.is("features", "http://etherx.jabber.org/streams"))
      return next();

    const prevent = await next();
    // BIND2 inline handler may have already set to online, eg inline SM resume
    if (!prevent && entity.jid && entity.status !== "online") {
      entity._status("online", entity.jid);
    }
  };
}
