import WS from 'ws'
import EventEmitter from 'events'

class Socket extends EventEmitter {
  constructor () {
    super()
  }

  connect (url, fn) {
    const sock = this.socket = new WS(url, ['xmpp'])
    // WS doesn't support removeEventListener
    sock.removeEventListener = sock.removeEventListener || sock.removeListener

    const openHandler = () => {
      if (fn) fn()
      this.emit('connect')
    }
    const messageHandler = ({data}) => this.emit('data', data)
    const errorHandler = (err) => {
      if (fn) fn(err)
      this.emit('error', err)
    }
    const closeHandler = () => {
      sock.removeEventListener('open', openHandler)
      sock.removeEventListener('message', messageHandler)
      sock.removeEventListener('error', errorHandler)
      sock.removeEventListener('close', closeHandler)
      this.emit('close')
    }

    sock.addEventListener('open', openHandler)
    sock.addEventListener('message', messageHandler)
    sock.addEventListener('error', errorHandler)
    sock.addEventListener('close', closeHandler)
  }

  close (fn) {
    this.once('close', fn)
    this.socket.close()
  }

  write (data, fn) {
    this.socket.send(data)
    fn()
  }
}

export default Socket
