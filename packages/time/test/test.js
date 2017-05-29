'use strict'

const test = require('ava')
const time = require('..')

const s = '21 Jully 1969 02:56 UTC'
const d = new Date(s)

test('date', t => {
  t.is(time.date(), time.date(new Date()))
  t.is(time.date(d), '1969-07-21')
  t.is(time.date(s), '1969-07-21')
})

test('time', t => {
  t.is(time.time(), time.time(new Date()))
  t.is(time.time(d), '02:56:00Z')
  t.is(time.time(s), '02:56:00Z')
})

test('datetime', t => {
  t.is(time.datetime(), time.datetime(new Date()))
  t.is(time.datetime(d), '1969-07-21T02:56:00Z')
  t.is(time.datetime(s), '1969-07-21T02:56:00Z')
})

test('offset', t => {
  function fake(value) {
    return {
      getTimezoneOffset() {
        return value
      },
    }
  }
  t.is(time.offset(fake(120)), '-02:00')
  t.is(time.offset(fake(-120)), '+02:00')
  t.is(time.offset(fake(90)), '-01:30')
  t.is(time.offset(fake(-90)), '+01:30')
})
