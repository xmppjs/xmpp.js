import { Socket as TCPSocket } from "net";

export default class Socket extends TCPSocket {
  secure = false;
}
