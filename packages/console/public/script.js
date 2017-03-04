'use strict'

const Console = require('../lib/Console')
const client = require('@xmpp/client')
const editor = require('./editor')
const {Prism, fetch, notie} = global

Prism.plugins.toolbar.registerButton('edit', {
  text: 'edit',
  onClick: env => {
    editor.setValue(env.code)
  }
})
// http://prismjs.com/plugins/toolbar/
Prism.plugins.toolbar.registerButton('select', {
  text: 'select',
  onClick: env => {
    // http://stackoverflow.com/a/11128179/2757940
    if (document.body.createTextRange) { // ms
      const range = document.body.createTextRange()
      range.moveToElementText(env.element)
      range.select()
    } else if (window.getSelection) { // moz, opera, webkit
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(env.element)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }
})

const entity = client()

const xconsole = new Console(entity)
xconsole.resetInput = function () {
  editor.setValue('')
}
xconsole.log = function (subject, body) {
  const div = document.createElement('div')
  div.classList.add('log-entry')
  div.textContent = subject

  if (subject === '⮈ IN' || subject === '⮊ OUT' || body instanceof Error) {
    const pre = document.createElement('pre')
    pre.classList.add('language-xml')
    const code = document.createElement('code')
    code.textContent = body
    pre.appendChild(code)
    Prism.highlightElement(code)
    div.appendChild(pre)
  } else if (body) {
    div.textContent += body
  }

  const outputEl = document.getElementById('output')
  if (outputEl.firstChild) {
    outputEl.insertBefore(div, outputEl.firstChild)
  } else {
    outputEl.appendChild(div)
  }
}
xconsole.ask = function (options) {
  return new Promise((resolve, reject) => {
    options.submitCallback = resolve
    options.cancelCallback = reject
    notie.input(options)
  })
}
xconsole.choose = function (options) {
  return new Promise((resolve, reject) => {
    options.cancelCallback = reject
    options.choices = options.choices.map((choice) => {
      return {
        text: choice,
        handler () {
          resolve(choice)
        }
      }
    })
    notie.select(options)
  })
}

function connect (params) {
  if (params.endpoint) {
    return entity.connect(params.endpoint)
  } else {
    return xconsole.ask({
      text: 'Enter endpoint',
      value: 'ws://localhost:5280/xmpp-websocket',
      type: 'url'
    }).then((endpoint) => {
      return entity.connect(endpoint)
    })
  }
}

fetch('/params').then((res) => {
  return res.json()
}).then((params) => {
  return connect(params)
}, () => {
  return connect({})
})

document.getElementById('input').addEventListener('submit', function (e) {
  e.preventDefault()
  xconsole.send(editor.getValue())
})

window.addEventListener('keydown', function (e) {
  if (e.defaultPrevented) return
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault()
    xconsole.send(editor.getValue())
  }
})
