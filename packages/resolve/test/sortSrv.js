'use strict'

const test = require('ava')
const sort = require('../lib/dns').sortSrv

test('by priority', t => {
  t.deepEqual(sort([{priority: 2, weight: 0}, {priority: 1, weight: 0}]), [
    {priority: 1, weight: 0},
    {priority: 2, weight: 0},
  ])

  t.deepEqual(sort([{priority: 2, weight: 1}, {priority: 1, weight: 0}]), [
    {priority: 1, weight: 0},
    {priority: 2, weight: 1},
  ])
})

test('by weight', t => {
  t.deepEqual(sort([{weight: 1, priority: 0}, {weight: 2, priority: 0}]), [
    {weight: 2, priority: 0},
    {weight: 1, priority: 0},
  ])

  t.deepEqual(sort([{weight: 2, priority: 0}, {weight: 1, priority: 0}]), [
    {weight: 2, priority: 0},
    {weight: 1, priority: 0},
  ])
})
