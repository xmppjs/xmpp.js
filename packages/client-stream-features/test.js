import test from 'ava'
import * as stream_features from './src/index'

test.skip('selectFeature', t => {
  const features = []
  features.push({
    priority: 1000,
    run: () => {},
    match: el => el.getChild('bind')
  })
  features.push({
    priority: 2000,
    run: () => {},
    match: el => el.getChild('bind')
  })

  const feature = stream_features.selectFeature(features, <foo><bind/></foo>)
  t.is(feature.priority, 2000)
})
