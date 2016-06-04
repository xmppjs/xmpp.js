import _StreamParser from '@xmpp/streamparser'

/*
 * hack for most usecases, do we have a better idea?
 *   catch the following:
 *   <?xml version="1.0"?>
 *   <?xml version="1.0" encoding="UTF-8"?>
 *   <?xml version="1.0" encoding="UTF-16" standalone="yes"?>
 */
function removeXMLHeader (data) {
  // check for xml tag
  const index = data.indexOf('<?xml')

  if (index !== -1) {
    const end = data.indexOf('?>')
    if (index >= 0 && end >= 0 && index < end + 2) {
      const search = data.substring(index, end + 2)
      data = data.replace(search, '')
    }
  }

  return data
}

class StreamParser extends _StreamParser {
  write (data) {
    data = data.toString('utf8')
    data = removeXMLHeader(data) // FIXME only once
    super.write(data)
  }
}

export default StreamParser
export {removeXMLHeader}
