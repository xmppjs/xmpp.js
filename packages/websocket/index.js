import ConnectionWebSocket from "./lib/Connection.js";

export default function websocket({ entity }) {
  entity.transports.push(ConnectionWebSocket);
}
