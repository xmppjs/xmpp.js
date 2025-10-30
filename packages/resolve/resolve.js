import * as dns from "./lib/dns.js";
import * as http from "./lib/http.js";

export default async function resolve(...args) {
  const result = await Promise.all([
    dns?.resolve?.(...args) ?? [],
    http.resolve(...args),
  ]);

  return result.flat();
}

export { dns, http };
