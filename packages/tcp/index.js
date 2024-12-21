import ConnectionTCP from "./lib/Connection.js";

export default function tcp({ entity }) {
  entity.transports.push(ConnectionTCP);
}
