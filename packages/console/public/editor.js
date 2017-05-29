'use strict'

const {CodeMirror, jQuery} = global

// https://codemirror.net/demo/xmlcomplete.html
function completeAfter(cm, pred) {
  if (!pred || pred()) {
    setTimeout(() => {
      if (!cm.state.completionActive) {
        cm.showHint({completeSingle: false})
      }
    }, 100)
  }
  return CodeMirror.Pass
}

function completeIfAfterLt(cm) {
  return completeAfter(cm, () => {
    const cur = cm.getCursor()
    return cm.getRange(CodeMirror.Pos(cur.line, cur.ch - 1), cur) === '<' // eslint-disable-line new-cap
  })
}

function completeIfInTag(cm) {
  return completeAfter(cm, () => {
    const tok = cm.getTokenAt(cm.getCursor())
    if (tok.type === 'string' && (!/['"]/.test(tok.string.charAt(tok.string.length - 1)) || tok.string.length === 1)) {
      return false
    }
    const inner = CodeMirror.innerMode(cm.getMode(), tok.state).state
    return inner.tagName
  })
}

jQuery('[data-toggle="tooltip"]').tooltip()

const tags = {
  '!top': ['iq', 'presence', 'message'],
  '!attrs': {
    id: null,
    'xml:lang': 'en',
    to: null,
    from: null,
    type: null,
    xmlns: null,
  },
  iq: {
    attrs: {
      type: ['get', 'set', 'result', 'error'],
    },
  },
  presence: {
    attrs: {
      type: ['subscribe', 'unsubscribe', 'probe', 'error', 'subscribed', 'unsubscribed', 'available', 'unavailable'],
    },
  },
  message: {
    attrs: {
      type: ['chat', 'normal'],
    },
  },
}

const editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
  lineNumbers: true,
  mode: 'xml',
  gutters: ['CodeMirror-foldgutter'],
  foldGutter: true,
  autoCloseTags: true,
  matchTags: {bothTags: true},
  extraKeys: {
    '\'<\'': completeAfter,
    '\'/\'': completeIfAfterLt,
    '\' \'': completeIfInTag,
    '\'=\'': completeIfInTag,
    'Ctrl-Space': 'autocomplete',
  },
  hintOptions: {schemaInfo: tags},
  theme: 'solarized light',
})

module.exports = editor
