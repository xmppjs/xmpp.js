'use strict'

const {Server} = require('./index')
const middleware = require('../middleware')

const server = new Server()

server.on('connection', connection => {
  connection.on('element', element => {
    console.log(element.toString())
  })
})

server.start()

const app = middleware({entity: server})

app.use(ctx => {
  console.log(ctx)
})
