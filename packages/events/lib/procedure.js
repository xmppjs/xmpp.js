export default function procedure(entity, stanza = null, handler) {
  return new Promise((resolve, reject) => {
    function stop(...args) {
      entity.removeListener("nonza", listener);
      resolve(...args);
    }

    async function listener(element) {
      try {
        await handler(element, stop);
      } catch (err) {
        reject(err);
        entity.removeListener("nonza", listener);
      }
    }

    stanza &&
      entity.send(stanza).catch((err) => {
        entity.removeListener("nonza", listener);
        reject(err);
      });
    entity.on("nonza", listener);
  });
}
