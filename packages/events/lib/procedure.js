export default function procedure(entity, stanza = null, handler) {
  return new Promise((resolve, reject) => {
    function onError(err) {
      entity.removeListener("nonza", listener);
      reject(err);
    }

    function done(...args) {
      entity.removeListener("nonza", listener);
      resolve(...args);
    }

    async function listener(element) {
      try {
        await handler(element, done);
      } catch (err) {
        onError(err);
      }
    }

    stanza && entity.send(stanza).catch(onError);
    entity.on("nonza", listener);
  });
}
