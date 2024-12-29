export default function route() {
  return async ({ stanza, entity }, next) => {
    if (!stanza.is("features", "http://etherx.jabber.org/streams"))
      return next();

    // FIXME: instead of this prevent mechanism
    // emit online once all stream features have negotiated
    // and if entity.jid is set
    const prevent = await next();
    if (!prevent && entity.jid) entity._status("online", entity.jid);
  };
}
