'use strict'

const test = require('ava')
const JID = require('..').JID

test('escape `space cadet@example.com`', t => {
  const esc = new JID('space cadet', 'example.com')
  t.is(esc.toString(), 'space\\20cadet@example.com')
  t.is(esc.toString(true), 'space cadet@example.com')
})

test('escape `call me "ishmael"@example.com`', t => {
  const esc = new JID('call me "ishmael"', 'example.com')
  t.is(esc.toString(), 'call\\20me\\20\\22ishmael\\22@example.com')
  t.is(esc.toString(true), 'call me "ishmael"@example.com')
})

test('escape `at&t guy@example.com`', t => {
  const esc = new JID('at&t guy', 'example.com')
  t.is(esc.toString(), 'at\\26t\\20guy@example.com')
  t.is(esc.toString(true), 'at&t guy@example.com')
})

test('escape `d\'artagnan@example.com`', t => {
  const esc = new JID('d\'artagnan', 'example.com')
  t.is(esc.toString(), 'd\\27artagnan@example.com')
  t.is(esc.toString(true), 'd\'artagnan@example.com')
})

test('escape `/.fanboy@example.com`', t => {
  const esc = new JID('/.fanboy', 'example.com')
  t.is(esc.toString(), '\\2f.fanboy@example.com')
  t.is(esc.toString(true), '/.fanboy@example.com')
})

test('escape `::foo::@example.com`', t => {
  const esc = new JID('::foo::', 'example.com')
  t.is(esc.toString(), '\\3a\\3afoo\\3a\\3a@example.com')
  t.is(esc.toString(true), '::foo::@example.com')
})

test('escape `<foo>@example.com`', t => {
  const esc = new JID('<foo>', 'example.com')
  t.is(esc.toString(), '\\3cfoo\\3e@example.com')
  t.is(esc.toString(true), '<foo>@example.com')
})

test('escape `user@host@example.com`', t => {
  const esc = new JID('user@host', 'example.com')
  t.is(esc.toString(), 'user\\40host@example.com')
  t.is(esc.toString(true), 'user@host@example.com')
})

test('escape `c:\\net@example.com`', t => {
  const esc = new JID('c:\\net', 'example.com')
  t.is(esc.toString(), 'c\\3a\\5cnet@example.com')
  t.is(esc.toString(true), 'c:\\net@example.com')
})

test('escape `c:\\\\net@example.com`', t => {
  const esc = new JID('c:\\\\net', 'example.com')
  t.is(esc.toString(), 'c\\3a\\5c\\5cnet@example.com')
  t.is(esc.toString(true), 'c:\\\\net@example.com')
})

test('escape `c:\\cool stuff@example.com`', t => {
  const esc = new JID('c:\\cool stuff', 'example.com')
  t.is(esc.toString(), 'c\\3a\\5ccool\\20stuff@example.com')
  t.is(esc.toString(true), 'c:\\cool stuff@example.com')
})

test('escape `c:\\5commas@example.com`', t => {
  const esc = new JID('c:\\5commas', 'example.com')
  t.is(esc.toString(), 'c\\3a\\5c5commas@example.com')
  t.is(esc.toString(true), 'c:\\5commas@example.com')
})

test('escape `space\\20cadet@example.com`', t => {
  const esc = new JID('space\\20cadet', 'example.com')
  t.is(esc.toString(), 'space\\20cadet@example.com')
  t.is(esc.toString(true), 'space cadet@example.com')
})

test('escape `call me "ishmael"@example.com`', t => {
  const esc = new JID('call me "ishmael"', 'example.com')
  t.is(esc.toString(), 'call\\20me\\20\\22ishmael\\22@example.com')
  t.is(esc.toString(true), 'call me "ishmael"@example.com')
})

test('escape `at\\26t\\20guy@example.com`', t => {
  const esc = new JID('at\\26t\\20guy', 'example.com')
  t.is(esc.toString(), 'at\\26t\\20guy@example.com')
  t.is(esc.toString(true), 'at&t guy@example.com')
})

test('escape `d\\27artagnan@example.com`', t => {
  const esc = new JID('d\\27artagnan', 'example.com')
  t.is(esc.toString(), 'd\\27artagnan@example.com')
  t.is(esc.toString(true), 'd\'artagnan@example.com')
})

test('escape `\\2f.fanboy@example.com`', t => {
  const esc = new JID('\\2f.fanboy', 'example.com')
  t.is(esc.toString(), '\\2f.fanboy@example.com')
  t.is(esc.toString(true), '/.fanboy@example.com')
})

test('escape `\\3a\\3afoo\\3a\\3a@example.com`', t => {
  const esc = new JID('\\3a\\3afoo\\3a\\3a', 'example.com')
  t.is(esc.toString(), '\\3a\\3afoo\\3a\\3a@example.com')
  t.is(esc.toString(true), '::foo::@example.com')
})

test('escape `\\3cfoo\\3e@example.com`', t => {
  const esc = new JID('\\3cfoo\\3e', 'example.com')
  t.is(esc.toString(), '\\3cfoo\\3e@example.com')
  t.is(esc.toString(true), '<foo>@example.com')
})

test('escape `user\\40host@example.com`', t => {
  const esc = new JID('user\\40host', 'example.com')
  t.is(esc.toString(), 'user\\40host@example.com')
  t.is(esc.toString(true), 'user@host@example.com')
})

test('escape `c\\3a\\5cnet@example.com`', t => {
  const esc = new JID('c\\3a\\5cnet', 'example.com')
  t.is(esc.toString(), 'c\\3a\\5cnet@example.com')
  t.is(esc.toString(true), 'c:\\net@example.com')
})

test('escape `c:\\\\net@example.com`', t => {
  const esc = new JID('c:\\\\net', 'example.com')
  t.is(esc.toString(), 'c\\3a\\5c\\5cnet@example.com')
  t.is(esc.toString(true), 'c:\\\\net@example.com')
})

test('escape `c\\3a\\5ccool\\20stuff@example.com`', t => {
  const esc = new JID('c\\3a\\5ccool\\20stuff', 'example.com')
  t.is(esc.toString(), 'c\\3a\\5ccool\\20stuff@example.com')
  t.is(esc.toString(true), 'c:\\cool stuff@example.com')
})

test('escape `c\\3a\\5c5commas@example.com`', t => {
  const esc = new JID('c\\3a\\5c5commas', 'example.com')
  t.is(esc.toString(), 'c\\3a\\5c5commas@example.com')
  t.is(esc.toString(true), 'c:\\5commas@example.com')
})
