import ConnectionTLS from "./lib/Connection.js";

export default function tls({ entity }) {
  entity.transports.push(ConnectionTLS);
}
