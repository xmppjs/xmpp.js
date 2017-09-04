'use strict'

function date(d = new Date()) {
  if (typeof d === 'string') {
    d = new Date(d)
  }
  return datetime(d).split('T')[0]
}

function time(d = new Date()) {
  if (typeof d === 'string') {
    d = new Date(d)
  }
  return datetime(d).split('T')[1]
}

function datetime(d = new Date()) {
  if (typeof d === 'string') {
    d = new Date(d)
  }
  return new Date(d).toISOString().split('.')[0] + 'Z'
}

function pad(value) {
  return value < 10 ? '0' + value : value
}

function formatOffset(n) {
  const sign = n > 0 ? '-' : '+'
  const offset = Math.abs(n)
  return sign + pad(Math.floor(offset / 60)) + ':' + pad(offset % 60)
}

function offset(d = new Date()) {
  if (typeof d === 'string') {
    d = new Date(d)
  }
  return formatOffset(d.getTimezoneOffset())
}

module.exports = {
  date,
  time,
  datetime,
  offset,
}
