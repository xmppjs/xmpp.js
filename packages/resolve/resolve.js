import * as dns from "./lib/dns.js";
import * as http from "./lib/http.js";

export default function resolve(...args) {
  return Promise.all([
    dns?.resolve?.(...args) ?? [],
    http.resolve(...args),
  ]).then(([records, endpoints]) => [...records, ...endpoints]);
}

export { dns, http };
