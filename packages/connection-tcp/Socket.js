import { Socket as TCPSocket } from "node:net";

export default class Socket extends TCPSocket {
  secure = false;
}
